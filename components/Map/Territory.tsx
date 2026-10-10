"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { EqualStencilFunc, KeepStencilOp, ShapeGeometry, type Material, type MeshBasicMaterial } from "three";
import { fixWinding, toOutlines, toShapes, type LonLat } from "@/lib/geo";
import { LAND_HEIGHT, LAND_STENCIL } from "./Land";

const FILL_OPACITY = 0.5;

/** Draws only where land was drawn, so a territory never spills over the sea. */
function onLandOnly(material: Material) {
  material.stencilWrite = true;
  material.stencilRef = LAND_STENCIL;
  material.stencilFunc = EqualStencilFunc;
  material.stencilFail = KeepStencilOp;
  material.stencilZFail = KeepStencilOp;
  material.stencilZPass = KeepStencilOp;
}

/** An era's territory: a translucent fill with a glowing edge, fading in when the era changes. */
export function Territory({ rings, color }: { rings: LonLat[][]; color: string }) {
  const { fill, outlines } = useMemo(() => {
    const polygons = rings.map((ring) => fixWinding([ring]));
    const fill = new ShapeGeometry(polygons.flatMap(toShapes), 2);
    const outlines = polygons.flatMap(toOutlines).map((ring) =>
      ring.map((p) => [p.x, LAND_HEIGHT + 0.04, p.z] as [number, number, number]),
    );
    return { fill, outlines };
  }, [rings]);

  const fillMaterial = useRef<MeshBasicMaterial>(null);
  const edges = useRef<({ material: Material } | null)[]>([]);

  useLayoutEffect(() => {
    if (fillMaterial.current) onLandOnly(fillMaterial.current);
    for (const line of edges.current) if (line) onLandOnly(line.material);
  }, [fill, outlines]);

  // Fade in.
  useFrame((_, dt) => {
    const m = fillMaterial.current;
    if (m && m.opacity < FILL_OPACITY) m.opacity = Math.min(FILL_OPACITY, m.opacity + dt * 1.2);
  });

  return (
    <group>
      <mesh geometry={fill} rotation-x={-Math.PI / 2} position-y={LAND_HEIGHT + 0.02} renderOrder={3}>
        <meshBasicMaterial ref={fillMaterial} color={color} transparent opacity={0} depthWrite={false} />
      </mesh>
      {outlines.map((points, i) => (
        <group key={i}>
          <Line
            ref={(el) => {
              edges.current[i * 2] = el;
            }}
            points={points}
            color={color}
            lineWidth={7}
            transparent
            opacity={0.25}
            depthWrite={false}
            renderOrder={4}
          />
          <Line
            ref={(el) => {
              edges.current[i * 2 + 1] = el;
            }}
            points={points}
            color={color}
            lineWidth={2}
            depthWrite={false}
            renderOrder={4}
          />
        </group>
      ))}
    </group>
  );
}
