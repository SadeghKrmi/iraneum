"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { Capital, EventType } from "@/lib/content";
import { toPlane, type LonLat } from "@/lib/geo";
import type { Locale } from "@/lib/i18n";
import { LAND_HEIGHT } from "./Land";
import { eventColors, type MapPalette } from "./palette";

/** Labels stay below the page's panels (which sit above the map's stacking context). */
const LABEL_Z: [number, number] = [4, 0];

function at(lonLat: LonLat, height = 0): [number, number, number] {
  const { x, z } = toPlane(lonLat);
  return [x, LAND_HEIGHT + height, z];
}

export function Capitals({ capitals, locale, palette }: { capitals: Capital[]; locale: Locale; palette: MapPalette }) {
  return capitals.map((c) => (
    <group key={c.name.en} position={at(c.at, 0.35)}>
      <mesh scale={[0.32, 0.45, 0.32]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={palette.capital} emissive={palette.capital} emissiveIntensity={0.35} />
      </mesh>
      <Html position={[0, 1.1, 0]} center zIndexRange={LABEL_Z} style={{ pointerEvents: "none" }}>
        <span
          className="block whitespace-nowrap text-xs font-medium"
          style={{ color: palette.label, textShadow: palette.labelShadow }}
          lang={locale}
        >
          {c.name[locale]}
        </span>
      </Html>
    </group>
  ));
}

/** The current event: a pulsing marker shaped by its type, with its title. */
export function EventMarker({
  position,
  type,
  title,
  palette,
}: {
  position: LonLat;
  type: EventType;
  title: string;
  palette: MapPalette;
}) {
  const pulse = useRef<Group>(null);
  useFrame(({ clock }) => {
    const s = 1 + 0.18 * Math.sin(clock.elapsedTime * 3);
    pulse.current?.scale.setScalar(s);
  });
  const color = eventColors[type];

  return (
    <group position={at(position, 0.5)}>
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
      <Html position={[0, 2, 0]} center zIndexRange={LABEL_Z} style={{ pointerEvents: "none" }}>
        <span
          className="block whitespace-nowrap text-sm font-bold"
          style={{ color: type === "battle" ? palette.battleLabel : palette.label, textShadow: palette.labelShadow }}
        >
          {title}
        </span>
      </Html>
    </group>
  );
}

/** The era's name over its territory, in Persian and English. */
export function EraLabel({
  position,
  fa,
  en,
  dimmed,
  palette,
}: {
  position: LonLat;
  fa: string;
  en: string;
  dimmed: boolean;
  palette: MapPalette;
}) {
  return (
    <Html position={at(position, 0.5)} center zIndexRange={LABEL_Z} style={{ pointerEvents: "none" }}>
      <span
        className="flex flex-col items-center text-center transition-opacity duration-500"
        style={{ opacity: dimmed ? 0.35 : 0.95 }}
      >
        <b
          lang="fa"
          dir="rtl"
          className="whitespace-nowrap text-4xl font-bold sm:text-5xl"
          style={{ color: "var(--gold)", textShadow: palette.labelShadow }}
        >
          {fa}
        </b>
        <i
          lang="en"
          className="whitespace-nowrap text-xs not-italic uppercase tracking-[0.3em] sm:text-sm"
          style={{ color: palette.label, textShadow: palette.labelShadow }}
        >
          {en}
        </i>
      </span>
    </Html>
  );
}
