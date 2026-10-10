"use client";

import { MapControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Vector3, type Camera, type PerspectiveCamera } from "three";
import type { Era, Scene } from "@/lib/content";
import { centroidOf, fixWinding, projectedSize, toPlane } from "@/lib/geo";
import { dirOf, type Locale } from "@/lib/i18n";
import { Land, type RegionData } from "./Land";
import { Capitals, EraLabel, EventMarker } from "./Markers";
import { useMapPalette } from "./palette";
import { Territory } from "./Territory";

export type AtlasMapProps = {
  locale: Locale;
  era: Era | null;
  scene: Scene | null;
  noWebglText: string;
  onReady?: () => void;
};

/** Pan limits around Iran, in map units. */
const BOUNDS = { x: 75, z: 50 };
/** The camera looks down at ~52° and approaches from the south. */
const VIEW_DIRECTION = new Vector3(0, 1.3, 1).normalize();

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function AtlasMap({ locale, era, scene, noWebglText, onReady }: AtlasMapProps) {
  const palette = useMapPalette();
  const [webgl] = useState(webglAvailable);
  const [region, setRegion] = useState<RegionData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/geo/region.json")
      .then((r) => r.json())
      .then((data: RegionData) => {
        if (!cancelled) setRegion(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const focus = useMemo(() => {
    if (scene?.at) return { ...toPlane(scene.at), distance: 40 };
    if (era) {
      const polygons = era.territory.map((ring) => fixWinding([ring]));
      const size = projectedSize(polygons);
      return { ...toPlane(centroidOf(polygons)), distance: Math.min(125, Math.max(35, size * 1.05)) };
    }
    return { x: 0, z: 0, distance: 85 };
  }, [era, scene]);

  const eraCentre = useMemo(
    () => (era ? centroidOf(era.territory.map((ring) => fixWinding([ring]))) : null),
    [era],
  );

  if (!webgl) {
    return (
      <p className="grid h-full place-items-center px-6 pb-40 text-center text-muted" data-no-webgl>
        {noWebglText}
      </p>
    );
  }

  return (
    <Canvas
      camera={{ fov: 40, near: 0.5, far: 1200, position: [0, 110, 85] }}
      gl={{ stencil: true, antialias: true }}
      dpr={[1, 1.75]}
    >
      <color attach="background" args={[palette.sea]} />
      <fog attach="fog" args={[palette.sea, 120, 260]} />
      <hemisphereLight args={["#ffffff", palette.sea, 1.4]} />
      <directionalLight position={[-40, 80, -30]} intensity={1.8} />
      {region && <Land region={region} palette={palette} />}
      {region && <ReadySignal onReady={onReady} />}
      {era && <Territory key={era.id} rings={era.territory} color={era.color} />}
      {era && <Capitals capitals={era.capitals} locale={locale} palette={palette} />}
      {era && eraCentre && (
        <EraLabel position={eraCentre} fa={era.title.fa} en={era.title.en} dimmed={!!scene?.at} palette={palette} />
      )}
      {scene?.at && scene.type && (
        <EventMarker
          key={scene.id}
          position={scene.at}
          type={scene.type}
          title={scene.title[locale]}
          palette={palette}
        />
      )}
      <MapControls makeDefault enableDamping minDistance={14} maxDistance={130} maxPolarAngle={1.15} />
      <CameraRig x={focus.x} z={focus.z} distance={focus.distance} />
      {era && <PanelOffset rtl={dirOf(locale) === "rtl"} />}
    </Canvas>
  );
}

/**
 * Moves the map's visual centre away from the era card, so what the camera looks at isn't hidden behind it:
 * sideways on wide screens (card at the start side), upward on phones (card at the bottom).
 */
function PanelOffset({ rtl }: { rtl: boolean }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);
  useEffect(() => {
    const wide = width >= 640;
    const x = wide ? (rtl ? 1 : -1) * Math.min(210, width * 0.16) : 0;
    const y = wide ? 0 : height * 0.2;
    camera.setViewOffset(width, height, x, y, width, height);
    camera.updateProjectionMatrix();
    return () => {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
  }, [camera, width, height, rtl]);
  return null;
}

function ReadySignal({ onReady }: { onReady?: () => void }) {
  useEffect(() => onReady?.(), [onReady]);
  return null;
}

type Controls = {
  target: Vector3;
  update: () => void;
  addEventListener: (type: "start", listener: () => void) => void;
  removeEventListener: (type: "start", listener: () => void) => void;
};

/** Eases the camera to the focus whenever it changes; dragging the map takes over until the next change. */
function CameraRig({ x, z, distance }: { x: number; z: number; distance: number }) {
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const camera = useThree((s) => s.camera) as Camera;
  const flying = useRef(true);

  useEffect(() => {
    flying.current = true;
  }, [x, z, distance]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => {
      flying.current = false;
    };
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, dt) => {
    if (!controls) return;
    const target = controls.target;

    // Keep the view around Iran: shift camera and target together, so the angle doesn't change.
    const shift = new Vector3(
      Math.max(-BOUNDS.x, Math.min(BOUNDS.x, target.x)) - target.x,
      0,
      Math.max(-BOUNDS.z, Math.min(BOUNDS.z, target.z)) - target.z,
    );
    if (shift.lengthSq() > 0) {
      target.add(shift);
      camera.position.add(shift);
    }

    if (flying.current) {
      const goal = new Vector3(x, 0, z);
      const cameraGoal = goal.clone().addScaledVector(VIEW_DIRECTION, distance);
      const k = 1 - Math.exp(-dt * 2.2);
      target.lerp(goal, k);
      camera.position.lerp(cameraGoal, k);
      if (target.distanceTo(goal) < 0.02 && camera.position.distanceTo(cameraGoal) < 0.05) flying.current = false;
    }
    controls.update();
  });

  return null;
}
