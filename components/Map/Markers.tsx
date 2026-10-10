"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Quaternion, Vector3, type Group } from "three";
import type { Capital, EventType } from "@/lib/content";
import { toSphere, type LonLat } from "@/lib/geo";
import { LAND_RADIUS } from "./constants";
import { eventColors, type MapPalette } from "./palette";

const Y = new Vector3(0, 1, 0);

/** Places children on the globe at `at`, standing upright (local +y along the surface normal). */
function OnGlobe({ at, height, children }: { at: LonLat; height: number; children: React.ReactNode }) {
  const { position, quaternion } = useMemo(() => {
    const position = toSphere(at, LAND_RADIUS + height);
    const quaternion = new Quaternion().setFromUnitVectors(Y, position.clone().normalize());
    return { position, quaternion };
  }, [at, height]);
  return (
    <group position={position} quaternion={quaternion}>
      {children}
    </group>
  );
}

export function Capitals({ capitals, palette }: { capitals: Capital[]; palette: MapPalette }) {
  return capitals.map((c) => (
    <OnGlobe key={c.name.en} at={c.at} height={0.35}>
      <mesh scale={[0.32, 0.45, 0.32]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={palette.capital} emissive={palette.capital} emissiveIntensity={0.35} />
      </mesh>
    </OnGlobe>
  ));
}

/** How long the event marker pulses after it appears, in seconds. */
const PULSE_SECONDS = 6;

/** The current event: a marker shaped by its type that pulses for a few seconds when it appears. */
export function EventMarker({ at, type }: { at: LonLat; type: EventType }) {
  const pulse = useRef<Group>(null);
  const age = useRef(0);
  useFrame(({ invalidate }, dt) => {
    if (age.current >= PULSE_SECONDS) return;
    age.current += Math.min(dt, 0.1);
    const fade = Math.max(0, 1 - age.current / PULSE_SECONDS);
    pulse.current?.scale.setScalar(1 + 0.25 * fade * Math.sin(age.current * 4));
    invalidate();
  });
  const color = eventColors[type];

  return (
    <OnGlobe at={at} height={0.5}>
      <group ref={pulse}>
        {type === "battle" ? (
          <mesh rotation-x={-Math.PI / 2}>
            <torusGeometry args={[0.9, 0.18, 8, 32]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ) : type === "monument" ? (
          <mesh scale={[0.6, 0.9, 0.6]}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
          </mesh>
        ) : (
          <mesh>
            <sphereGeometry args={[0.55, 16, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
          </mesh>
        )}
      </group>
    </OnGlobe>
  );
}
