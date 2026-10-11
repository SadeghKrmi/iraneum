"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useEffectEvent } from "react";
import { Raycaster, Sphere, Vector2, Vector3 } from "three";
import { lonLatOf, smallestContaining, type LonLat } from "@/lib/geo";
import { LAND_RADIUS } from "./constants";

/** A press that moves less than this (px) and lasts less than CLICK_MS is a click, not a drag. */
const CLICK_PX = 6;
const CLICK_MS = 500;

const raycaster = new Raycaster();
const ndc = new Vector2();
const globe = new Sphere(new Vector3(), LAND_RADIUS);
const hit = new Vector3();

/**
 * Lets the other civilizations be picked on the globe: a click on a territory picks it (the smallest one
 * when they overlap), a click anywhere else clears the pick. With a mouse, the cursor shows a pointer over
 * a territory. Dragging, pinching and zooming stay with <GlobeRig>.
 */
export function WorldPicker({
  entries,
  onPick,
}: {
  entries: readonly { id: string; rings: LonLat[][] }[];
  onPick: (id: string | null) => void;
}) {
  const camera = useThree((s) => s.camera);
  const canvas = useThree((s) => s.gl.domElement);

  /** The civilization under a point on the screen, or null (none there, or not on the globe). */
  const pickAt = useEffectEvent((clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectSphere(globe, hit)) return null;
    return smallestContaining(entries, lonLatOf(hit));
  });
  const pick = useEffectEvent((id: string | null) => onPick(id));

  useEffect(() => {
    let press: { id: number; x: number; y: number; at: number } | null = null;
    let pressed = 0;
    let frame = 0;

    const down = (e: PointerEvent) => {
      pressed++;
      press = pressed === 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now() } : null;
    };
    const up = (e: PointerEvent) => {
      pressed = Math.max(0, pressed - 1);
      const p = press;
      press = null;
      if (!p || p.id !== e.pointerId) return;
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > CLICK_PX || performance.now() - p.at > CLICK_MS) return;
      pick(pickAt(e.clientX, e.clientY));
    };
    const cancel = () => {
      pressed = Math.max(0, pressed - 1);
      press = null;
    };
    const hover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.buttons !== 0 || frame) return;
      const { clientX, clientY } = e;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // Empty falls back to the map's own "grab" cursor.
        canvas.style.cursor = pickAt(clientX, clientY) ? "pointer" : "";
      });
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("pointermove", hover);
    return () => {
      cancelAnimationFrame(frame);
      canvas.style.cursor = "";
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("pointermove", hover);
    };
  }, [canvas]);

  return null;
}
