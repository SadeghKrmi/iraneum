"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import type { PerspectiveCamera } from "three";
import type { Era, Scene } from "@/lib/content";
import { centroidOf, extentOf } from "@/lib/geo";
import { dirOf, type Locale } from "@/lib/i18n";
import { Globe } from "./Globe";
import { GlobeRig, MAX_ALTITUDE, type GlobeGoal } from "./GlobeRig";
import { LabelLayer, LabelProjector, type LabelElements, type MapLabel } from "./Labels";
import { Land } from "./Land";
import { Capitals, EventMarker } from "./Markers";
import { useMapPalette } from "./palette";
import { Territory } from "./Territory";

export type AtlasMapProps = {
  locale: Locale;
  era: Era | null;
  scene: Scene | null;
  /** The era card is showing, so the view's centre moves out from under it. */
  panelOpen: boolean;
  noWebglText: string;
  onReady?: () => void;
};

/** Iran, seen from far enough away to show the whole globe. */
const HOME: GlobeGoal = { lon: 52, lat: 30, altitude: 230 };

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function AtlasMap({ locale, era, scene, panelOpen, noWebglText, onReady }: AtlasMapProps) {
  const palette = useMapPalette();
  const [webgl] = useState(webglAvailable);
  const [elements] = useState<LabelElements>(() => new Map());

  const eraCentre = useMemo(() => (era ? centroidOf(era.territory) : null), [era]);

  const goal = useMemo<GlobeGoal>(() => {
    if (scene?.at) return { lon: scene.at[0], lat: scene.at[1], altitude: 40 };
    if (era && eraCentre) {
      // 1° of arc is ~1.75 units; stand back far enough to see the whole territory.
      const altitude = Math.min(MAX_ALTITUDE, Math.max(35, extentOf(era.territory) * 1.75 * 1.1));
      return { lon: eraCentre[0], lat: eraCentre[1], altitude };
    }
    return HOME;
  }, [era, eraCentre, scene]);

  const labels = useMemo<MapLabel[]>(() => {
    if (!era || !eraCentre) return [];
    const shadow = { textShadow: palette.labelShadow };
    const list: MapLabel[] = era.capitals.map((c) => ({
      id: `capital-${c.name.en}`,
      at: c.at,
      height: 1.6,
      content: (
        <span className="block whitespace-nowrap text-xs font-medium" style={{ color: palette.label, ...shadow }}>
          {c.name[locale]}
        </span>
      ),
    }));
    list.push({
      id: `era-${era.id}`,
      at: eraCentre,
      height: 0.5,
      content: (
        <span
          className="flex flex-col items-center text-center transition-opacity duration-500"
          style={{ opacity: scene?.at ? 0.35 : 0.95 }}
        >
          <b lang="fa" dir="rtl" className="whitespace-nowrap text-4xl font-bold sm:text-5xl" style={{ color: "var(--gold)", ...shadow }}>
            {era.title.fa}
          </b>
          <i lang="en" className="whitespace-nowrap text-xs uppercase not-italic tracking-[0.3em] sm:text-sm" style={{ color: palette.label, ...shadow }}>
            {era.title.en}
          </i>
        </span>
      ),
    });
    if (scene?.at && scene.type) {
      list.push({
        id: `event-${scene.id}`,
        at: scene.at,
        height: 2.6,
        content: (
          <span
            className="block whitespace-nowrap text-sm font-bold"
            style={{ color: scene.type === "battle" ? palette.battleLabel : palette.label, ...shadow }}
          >
            {scene.title[locale]}
          </span>
        ),
      });
    }
    return list;
  }, [era, eraCentre, scene, locale, palette]);

  if (!webgl) {
    return (
      <p className="grid h-full place-items-center px-6 pb-40 text-center text-muted" data-no-webgl>
        {noWebglText}
      </p>
    );
  }

  return (
    <>
      <Canvas
        camera={{ fov: 40, near: 0.5, far: 2000 }}
        gl={{ stencil: true, antialias: true }}
        dpr={[1, 1.75]}
        // Draw only when something changes (camera moving, fades, pulses): saves battery on phones.
        frameloop="demand"
        // The globe handles dragging and pinching itself.
        style={{ touchAction: "none", cursor: "grab" }}
      >
        <color attach="background" args={[palette.background]} />
        <Globe palette={palette} />
        <Land palette={palette} onReady={onReady} />
        {era && <Territory key={era.id} rings={era.territory} color={era.color} />}
        {era && <Capitals capitals={era.capitals} palette={palette} />}
        {scene?.at && scene.type && <EventMarker key={scene.id} at={scene.at} type={scene.type} />}
        <GlobeRig goal={goal} />
        <LabelProjector labels={labels} elements={elements} />
        {era && panelOpen && <PanelOffset rtl={dirOf(locale) === "rtl"} />}
      </Canvas>
      <LabelLayer labels={labels} elements={elements} />
    </>
  );
}

/**
 * Moves the map's visual centre away from the era card, so what the camera looks at isn't hidden behind it:
 * sideways on wide screens (card at the start side), upward on phones (card at the bottom).
 */
function PanelOffset({ rtl }: { rtl: boolean }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const wide = width >= 640;
    const x = wide ? (rtl ? 1 : -1) * Math.min(210, width * 0.16) : 0;
    const y = wide ? 0 : height * 0.2;
    camera.setViewOffset(width, height, x, y, width, height);
    camera.updateProjectionMatrix();
    invalidate();
    return () => {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      invalidate();
    };
  }, [camera, width, height, rtl, invalidate]);
  return null;
}
