"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Quaternion, Vector3 } from "three";
import { routeArc, type LonLat } from "@/lib/geo";
import { LAND_RADIUS } from "./constants";

/** How long the dashes flow along the route after it appears, in seconds. */
const FLOW_SECONDS = 8;
const Y = new Vector3(0, 1, 0);

type DashedLine = { material: { dashOffset: number } };

/** A campaign or journey: an arched, dashed line flowing toward its goal, with an arrowhead at the end. */
export function Route({ points, color }: { points: LonLat[]; color: string }) {
  const { path, tip, direction } = useMemo(() => {
    const path = routeArc(points, LAND_RADIUS + 0.4);
    const tip = path[path.length - 1];
    const before = path[Math.max(0, path.length - 3)];
    const direction = new Quaternion().setFromUnitVectors(Y, tip.clone().sub(before).normalize());
    return { path, tip, direction };
  }, [points]);

  const line = useRef<DashedLine | null>(null);
  const age = useRef(0);
  useFrame(({ invalidate }, dt) => {
    if (age.current >= FLOW_SECONDS || !line.current) return;
    age.current += Math.min(dt, 0.1);
    line.current.material.dashOffset -= Math.min(dt, 0.1) * 2.5;
    invalidate();
  });

  return (
    <group>
      {/* A faint solid path under the dashes keeps the whole route readable. */}
      <Line points={path} color={color} lineWidth={2} transparent opacity={0.35} renderOrder={6} />
      <Line
        ref={(el) => {
          line.current = el as unknown as DashedLine | null;
        }}
        points={path}
        color={color}
        lineWidth={4}
        dashed
        dashSize={1.1}
        gapSize={0.6}
        renderOrder={6}
      />
      <mesh position={tip} quaternion={direction} renderOrder={6}>
        <coneGeometry args={[0.55, 1.6, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
