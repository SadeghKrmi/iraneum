"use client";

import { Line } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { BufferGeometry, DoubleSide, Float32BufferAttribute, ReplaceStencilOp } from "three";
import { toSphere, type LonLat } from "@/lib/geo";
import { LAND_RADIUS, LAND_STENCIL } from "./constants";
import type { LandBuffers } from "./land.worker";
import type { MapPalette } from "./palette";

/** Today's borders of Iran: [polygon][ring][point]. */
type IranBorder = LonLat[][][];

// Built once per page visit and reused, e.g. when switching language re-creates the map.
let landOnce: Promise<LandBuffers> | null = null;
let iranOnce: Promise<IranBorder> | null = null;

function loadLand(): Promise<LandBuffers> {
  landOnce ??= new Promise<LandBuffers>((resolve, reject) => {
    const worker = new Worker(new URL("./land.worker.ts", import.meta.url));
    worker.onmessage = (e: MessageEvent<LandBuffers>) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.onerror = (e) => {
      landOnce = null;
      reject(e);
      worker.terminate();
    };
    worker.postMessage({ url: new URL("/geo/land-50m.json", location.href).href });
  });
  return landOnce;
}

function loadIran(): Promise<IranBorder> {
  iranOnce ??= fetch("/geo/iran.json").then((r) => r.json() as Promise<IranBorder>);
  return iranOnce;
}

/** Loads and builds the world's land in a worker; calls onReady once it's on screen. */
export function Land({ palette, onReady }: { palette: MapPalette; onReady?: () => void }) {
  const [buffers, setBuffers] = useState<LandBuffers | null>(null);
  const [iran, setIran] = useState<IranBorder | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLand()
      .then((data) => {
        if (!cancelled) setBuffers(data);
      })
      .catch(() => {});
    loadIran()
      .then((data) => {
        if (!cancelled) setIran(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const geometry = useMemo(() => {
    if (!buffers) return null;
    const surface = new BufferGeometry();
    surface.setAttribute("position", new Float32BufferAttribute(buffers.surface, 3));
    surface.setAttribute("normal", new Float32BufferAttribute(buffers.normals, 3));
    const walls = new BufferGeometry();
    walls.setAttribute("position", new Float32BufferAttribute(buffers.walls, 3));
    const coast = new BufferGeometry();
    coast.setAttribute("position", new Float32BufferAttribute(buffers.coast, 3));
    return { surface, walls, coast };
  }, [buffers]);

  const border = useMemo(
    () =>
      iran
        ?.flatMap((polygon) => polygon)
        .filter((ring) => ring.length > 8)
        .map((ring) => ring.map((p) => toSphere(p, LAND_RADIUS + 0.06))),
    [iran],
  );

  useEffect(() => {
    if (geometry) onReady?.();
  }, [geometry, onReady]);

  if (!geometry) return null;
  return (
    <group>
      <mesh geometry={geometry.surface} renderOrder={1}>
        <meshStandardMaterial
          color={palette.land}
          roughness={1}
          metalness={0}
          stencilWrite
          stencilRef={LAND_STENCIL}
          stencilZPass={ReplaceStencilOp}
        />
      </mesh>
      <mesh geometry={geometry.walls} renderOrder={1}>
        <meshStandardMaterial
          color={palette.land}
          roughness={1}
          flatShading
          side={DoubleSide}
          stencilWrite
          stencilRef={LAND_STENCIL}
          stencilZPass={ReplaceStencilOp}
        />
      </mesh>
      <lineSegments geometry={geometry.coast} renderOrder={2}>
        <lineBasicMaterial color={palette.coast} transparent opacity={0.7} />
      </lineSegments>
      {border?.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={palette.iranBorder}
          lineWidth={1.2}
          dashed
          dashSize={0.6}
          gapSize={0.45}
          transparent
          opacity={0.75}
          renderOrder={5}
        />
      ))}
    </group>
  );
}
