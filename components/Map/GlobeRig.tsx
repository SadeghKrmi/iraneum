"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";
import { GLOBE_RADIUS, shortestLonDelta, surfaceFrame, toSphere, wrapLon } from "@/lib/geo";

/** Where the camera should look: a point on the globe and the camera's height above it. */
export type GlobeGoal = { lon: number; lat: number; altitude: number };

export const MIN_ALTITUDE = 12;
export const MAX_ALTITUDE = 320;
const DEG = Math.PI / 180;

/** Straight down from far away; tilted toward the horizon (~52°) close to the ground. */
function tiltFor(altitude: number) {
  const t = Math.min(1, Math.max(0, (altitude - 40) / 160));
  return 52 * (1 - t) * DEG;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Camera for the globe. Flies to `goal` whenever it changes; drag rotates the globe, wheel or pinch
 * zooms, and any of these takes over until the next goal. North always stays up.
 */
export function GlobeRig({ goal }: { goal: GlobeGoal }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const canvas = useThree((s) => s.gl.domElement);
  const invalidate = useThree((s) => s.invalidate);
  const view = useRef({ lon: goal.lon, lat: goal.lat, altitude: Math.min(MAX_ALTITUDE, goal.altitude * 1.5) });
  const flying = useRef(true);
  const velocity = useRef({ lon: 0, lat: 0 });

  useEffect(() => {
    flying.current = true;
    invalidate();
  }, [goal.lon, goal.lat, goal.altitude, invalidate]);

  useEffect(() => {
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    let lastMove = 0;

    const zoomBy = (factor: number) => {
      view.current.altitude = clamp(view.current.altitude * factor, MIN_ALTITUDE, MAX_ALTITUDE);
      invalidate();
    };
    const pinchDistance = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    /** Degrees of arc under one pixel at the current altitude. */
    const degreesPerPixel = () => {
      const visible = 2 * view.current.altitude * Math.tan((camera.fov * DEG) / 2);
      return (visible / (canvas.clientHeight || 1) / GLOBE_RADIUS) / DEG;
    };

    const down = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      flying.current = false;
      velocity.current = { lon: 0, lat: 0 };
      (e.currentTarget as HTMLElement).style.cursor = "grabbing";
      if (pointers.size === 2) pinch = pinchDistance();
    };
    const move = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (pointers.size === 2) {
        const d = pinchDistance();
        if (pinch && d) zoomBy(pinch / d);
        pinch = d;
        return;
      }
      // Grab the globe: what's under the pointer follows it.
      const v = view.current;
      const k = degreesPerPixel();
      const dLon = (-dx * k) / Math.max(0.2, Math.cos(v.lat * DEG));
      const dLat = dy * k;
      v.lon = wrapLon(v.lon + dLon);
      v.lat = clamp(v.lat + dLat, -80, 80);
      const now = performance.now();
      const dt = Math.max(8, now - lastMove) / 1000;
      lastMove = now;
      velocity.current = { lon: dLon / dt, lat: dLat / dt };
      invalidate();
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinch = 0;
      if (pointers.size === 0) {
        (e.currentTarget as HTMLElement).style.cursor = "";
        if (performance.now() - lastMove > 80) velocity.current = { lon: 0, lat: 0 };
        invalidate();
      }
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      flying.current = false;
      zoomBy(Math.exp(e.deltaY * 0.0015));
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("wheel", wheel);
    };
  }, [camera, canvas, invalidate]);

  useFrame((_, delta) => {
    const v = view.current;
    const dt = Math.min(delta, 0.1);
    if (flying.current) {
      const k = 1 - Math.exp(-dt * 2.2);
      const dLon = shortestLonDelta(v.lon, goal.lon);
      v.lon = wrapLon(v.lon + dLon * k);
      v.lat += (goal.lat - v.lat) * k;
      v.altitude = Math.exp(Math.log(v.altitude) + (Math.log(goal.altitude) - Math.log(v.altitude)) * k);
      if (Math.abs(dLon) < 0.01 && Math.abs(goal.lat - v.lat) < 0.01 && Math.abs(goal.altitude - v.altitude) < 0.05) {
        flying.current = false;
      }
    } else if (velocity.current.lon || velocity.current.lat) {
      // A little momentum after a flick.
      const vel = velocity.current;
      v.lon = wrapLon(v.lon + vel.lon * dt);
      v.lat = clamp(v.lat + vel.lat * dt, -80, 80);
      const decay = Math.exp(-dt * 5);
      vel.lon *= decay;
      vel.lat *= decay;
      if (Math.abs(vel.lon) < 0.05 && Math.abs(vel.lat) < 0.05) velocity.current = { lon: 0, lat: 0 };
    }

    const tilt = tiltFor(v.altitude);
    const target = toSphere([v.lon, v.lat]);
    const { north, up } = surfaceFrame([v.lon, v.lat]);
    camera.position
      .copy(target)
      .addScaledVector(up, v.altitude * Math.cos(tilt))
      .addScaledVector(north, -v.altitude * Math.sin(tilt));
    camera.up.copy(north).multiplyScalar(Math.cos(tilt)).addScaledVector(up, Math.sin(tilt));
    camera.lookAt(target);
    // The map only redraws on request: keep asking while the camera is still moving.
    if (flying.current || velocity.current.lon || velocity.current.lat) invalidate();
  });

  return null;
}
