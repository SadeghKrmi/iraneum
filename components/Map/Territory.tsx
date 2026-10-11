"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { EqualStencilFunc, KeepStencilOp, type Material, type MeshBasicMaterial } from "three";
import { closeRing, densify, lonLatShapes, shapesOnSphere, toSphere, type LonLat } from "@/lib/geo";
import { LAND_RADIUS, LAND_STENCIL } from "./constants";


/** Draws only where land was drawn, so a territory never spills over the sea. */
function onLandOnly(material: Material) {
  material.stencilWrite = true;
  material.stencilRef = LAND_STENCIL;
  material.stencilFunc = EqualStencilFunc;
  material.stencilFail = KeepStencilOp;
  material.stencilZFail = KeepStencilOp;
  material.stencilZPass = KeepStencilOp;
}

type Props = {
  rings: LonLat[][];
  color: string;
  /** How strongly the area is tinted (Iran's era is strong, other civilizations are faint). */
  fillOpacity?: number;
  edgeWidth?: number;
  glow?: boolean;
};

/** A territory: a translucent fill with an edge (optionally glowing), fading in when it appears. */
export function Territory({ rings, color, fillOpacity = 0.5, edgeWidth = 2, glow = true }: Props) {
  const { fill, outlines } = useMemo(() => {
    const closed = rings.map((ring) => closeRing(ring));
    const fill = shapesOnSphere(lonLatShapes(closed.map((ring) => [ring])), LAND_RADIUS + 0.03, 2);
    const outlines = closed.map((ring) => densify(ring, 0.5).map((p) => toSphere(p, LAND_RADIUS + 0.05)));
    return { fill, outlines };
  }, [rings]);

  const fillMaterial = useRef<MeshBasicMaterial>(null);
  const edges = useRef<({ material: Material } | null)[]>([]);

  useLayoutEffect(() => {
    if (fillMaterial.current) onLandOnly(fillMaterial.current);
    for (const line of edges.current) if (line) onLandOnly(line.material);
  }, [fill, outlines]);

  // Fade toward the target opacity (asking for the next frame until done: the map redraws on request).
  useFrame(({ invalidate }, dt) => {
    const m = fillMaterial.current;
    if (!m || Math.abs(m.opacity - fillOpacity) < 0.005) return;
    const stepBy = Math.min(dt, 0.1) * 1.2;
    m.opacity += Math.max(-stepBy, Math.min(stepBy, fillOpacity - m.opacity));
    invalidate();
  });

  return (
    <group>
      <mesh geometry={fill} renderOrder={3}>
        <meshBasicMaterial ref={fillMaterial} color={color} transparent opacity={0} depthWrite={false} />
      </mesh>
      {outlines.map((points, i) => (
        <group key={i}>
          {glow && (
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
          )}
          <Line
            ref={(el) => {
              edges.current[i * 2 + 1] = el;
            }}
            points={points}
            color={color}
            lineWidth={edgeWidth}
            transparent={!glow}
            opacity={glow ? 1 : 0.8}
            depthWrite={false}
            renderOrder={4}
          />
        </group>
      ))}
    </group>
  );
}
