"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";
import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, ReplaceStencilOp } from "three";
import type { MultiPolygon } from "geojson";
import { toOutlines, toShapes } from "@/lib/geo";
import type { MapPalette } from "./palette";

/** Height of the land above the sea, in map units. */
export const LAND_HEIGHT = 0.35;
/** Land writes this stencil value so territories can be drawn on land only. */
export const LAND_STENCIL = 1;

export type RegionData = { land: MultiPolygon["coordinates"]; iran: MultiPolygon["coordinates"] };

export function Land({ region, palette }: { region: RegionData; palette: MapPalette }) {
  const { land, coast, iran } = useMemo(() => {
    const geometry: MultiPolygon = { type: "MultiPolygon", coordinates: region.land };
    const land = new ExtrudeGeometry(toShapes(geometry), {
      depth: LAND_HEIGHT,
      bevelEnabled: false,
      curveSegments: 1,
    });
    // All coastlines in one line-segment buffer: cheap to draw.
    const points: number[] = [];
    for (const ring of toOutlines(geometry)) {
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1];
        const b = ring[i];
        points.push(a.x, LAND_HEIGHT + 0.01, a.z, b.x, LAND_HEIGHT + 0.01, b.z);
      }
    }
    const coast = new BufferGeometry();
    coast.setAttribute("position", new Float32BufferAttribute(points, 3));
    const iran = toOutlines({ type: "MultiPolygon", coordinates: region.iran })
      .filter((ring) => ring.length > 8)
      .map((ring) => ring.map((p) => [p.x, LAND_HEIGHT + 0.05, p.z] as [number, number, number]));
    return { land, coast, iran };
  }, [region]);

  return (
    <group>
      <mesh geometry={land} rotation-x={-Math.PI / 2} renderOrder={1}>
        <meshStandardMaterial
          color={palette.land}
          roughness={1}
          metalness={0}
          stencilWrite
          stencilRef={LAND_STENCIL}
          stencilZPass={ReplaceStencilOp}
        />
      </mesh>
      <lineSegments geometry={coast} renderOrder={2}>
        <lineBasicMaterial color={palette.coast} transparent opacity={0.7} />
      </lineSegments>
      {iran.map((points, i) => (
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
