"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import type { PerspectiveCamera } from "three";
import { shortTitleOf, type Era, type Scene } from "@/lib/content";
import { centroidOf, extentOf, pointsFocus, type LonLat } from "@/lib/geo";
import { dirOf, type Locale } from "@/lib/i18n";
import { worldTerritory, type WorldCivilization } from "@/lib/world";
import { Globe } from "./Globe";
import { GlobeRig, MAX_ALTITUDE, type GlobeGoal } from "./GlobeRig";
import { LabelLayer, LabelProjector, type LabelElements, type MapLabel } from "./Labels";
import { Land } from "./Land";
import { Capitals, EventMarker } from "./Markers";
import { Mountains } from "./Mountains";
import { routeColors, useMapPalette } from "./palette";
import { Route } from "./Route";
import { Territory } from "./Territory";
import { WorldPicker } from "./WorldPicker";

export type AtlasMapProps = {
  locale: Locale;
  era: Era | null;
  scene: Scene | null;
  /** The territory at the current scene: the era at its height, or a border change within the era. */
  territory: { key: string; rings: LonLat[][] } | null;
  /** Other civilizations that existed at the current scene's year (empty when comparing is off). */
  world: WorldCivilization[];
  /** The current scene's year, for the other civilizations' borders at that time. */
  year: number | null;
  /** A civilization picked in the "Meanwhile" panel: highlighted, and the camera flies to it. */
  highlight: string | null;
  /** The era card is showing, so the view's centre moves out from under it. */
  panelOpen: boolean;
  /** The right-hand column (meanwhile panel, map key) is showing on a wide screen. */
  endPanel: boolean;
  noWebglText: string;
  /** A civilization was clicked on the map (null: a click on nothing pickable). */
  onPick?: (id: string | null) => void;
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

export default function AtlasMap({
  locale,
  era,
  scene,
  territory,
  world,
  year,
  highlight,
  panelOpen,
  endPanel,
  noWebglText,
  onPick,
  onReady,
}: AtlasMapProps) {
  const palette = useMapPalette();
  const [webgl] = useState(webglAvailable);
  const [elements] = useState<LabelElements>(() => new Map());

  const eraCentre = useMemo(() => (era ? centroidOf(era.territory) : null), [era]);

  // Each civilization with its borders in the scene's year, the centre of those borders and their size.
  const shown = useMemo(
    () =>
      world.map((c) => {
        const { key, rings } = worldTerritory(c, year ?? c.from);
        return { id: c.id, c, key, rings, centre: centroidOf(rings), extent: extentOf(rings) };
      }),
    [world, year],
  );

  const goal = useMemo<GlobeGoal>(() => {
    const picked = shown.find((s) => s.c.id === highlight);
    if (picked) {
      const altitude = Math.min(MAX_ALTITUDE, Math.max(45, picked.extent * 1.75 * 1.2));
      return { lon: picked.centre[0], lat: picked.centre[1], altitude };
    }
    if (scene?.at && (scene.route || (scene.borders && territory))) {
      // Frame the whole campaign, from its start to the event's place, and the new borders when they change.
      const points = [scene.at, ...(scene.route ?? []), ...(scene.borders && territory ? territory.rings.flat() : [])];
      const { centre, extent } = pointsFocus(points);
      // A little more room when framing borders: the panels at the sides cover their edges.
      const margin = scene.borders ? 1.5 : 1.3;
      return { lon: centre[0], lat: centre[1], altitude: Math.min(220, Math.max(40, extent * 1.75 * margin)) };
    }
    if (scene?.at) return { lon: scene.at[0], lat: scene.at[1], altitude: 40 };
    if (era && eraCentre) {
      // 1° of arc is ~1.75 units; stand back far enough to see the whole territory.
      const altitude = Math.min(MAX_ALTITUDE, Math.max(35, extentOf(era.territory) * 1.75 * 1.1));
      return { lon: eraCentre[0], lat: eraCentre[1], altitude };
    }
    return HOME;
  }, [era, eraCentre, scene, territory, shown, highlight]);

  const labels = useMemo<MapLabel[]>(() => {
    if (!era || !eraCentre) return [];
    const shadow = { textShadow: palette.labelShadow };
    // Iran's own labels always show (only a capital gives way to an earlier capital right next to it, such as
    // Pasargadae beside Persepolis); the other civilizations' names give way to them and to larger neighbours.
    const list: MapLabel[] = era.capitals.map((c, i) => ({
      id: `capital-${c.name.en}`,
      at: c.at,
      height: 1.6,
      priority: 1500 - i,
      yields: i > 0,
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
      priority: 1000,
      content: (
        <span
          className="flex flex-col items-center text-center transition-opacity duration-500"
          style={{ opacity: scene?.at ? 0.35 : 0.95 }}
        >
          <b lang="fa" dir="rtl" className="whitespace-nowrap text-4xl font-bold sm:text-5xl" style={{ color: "var(--gold)", ...shadow }}>
            {shortTitleOf(era).fa}
          </b>
          <i lang="en" className="whitespace-nowrap text-xs uppercase not-italic tracking-[0.3em] sm:text-sm" style={{ color: palette.label, ...shadow }}>
            {shortTitleOf(era).en}
          </i>
        </span>
      ),
    });
    for (const { c, centre, extent } of shown) {
      const strong = c.id === highlight;
      list.push({
        id: `world-${c.id}`,
        at: centre,
        height: 0.4,
        priority: strong ? 500 : extent,
        yields: true,
        content: (
          <span
            className={`flex items-center gap-1.5 whitespace-nowrap ${strong ? "text-sm font-bold" : "text-xs font-medium"}`}
            style={{ color: palette.label, ...shadow, opacity: strong ? 1 : 0.85 }}
          >
            <span aria-hidden className="size-2 rounded-full" style={{ background: c.color }} />
            {c.name[locale]}
          </span>
        ),
      });
    }
    if (scene?.at && scene.type) {
      list.push({
        id: `event-${scene.id}`,
        at: scene.at,
        height: 2.6,
        priority: 2000,
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
  }, [era, eraCentre, scene, locale, palette, shown, highlight]);

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
        <Mountains palette={palette} />
        {shown.map(({ c, key, rings }) => (
          <Territory
            key={`world-${key}`}
            rings={rings}
            color={c.color}
            fillOpacity={c.id === highlight ? 0.38 : 0.16}
            edgeWidth={c.id === highlight ? 2 : 1.2}
            glow={false}
          />
        ))}
        {era && territory && <Territory key={`era-${territory.key}`} rings={territory.rings} color={era.color} />}
        {era && <Capitals capitals={era.capitals} palette={palette} />}
        {scene?.at && scene.type && <EventMarker key={`event-${scene.id}`} at={scene.at} type={scene.type} />}
        {scene?.route && (
          <Route
            key={`route-${scene.id}`}
            points={scene.route}
            color={scene.type === "battle" ? routeColors.battle : routeColors.other}
          />
        )}
        <GlobeRig goal={goal} />
        {onPick && shown.length > 0 && <WorldPicker entries={shown} onPick={onPick} />}
        <LabelProjector labels={labels} elements={elements} />
        {era && (panelOpen || endPanel) && (
          <PanelOffset rtl={dirOf(locale) === "rtl"} start={panelOpen} end={endPanel} />
        )}
      </Canvas>
      <LabelLayer labels={labels} elements={elements} />
    </>
  );
}

/**
 * Moves the map's visual centre away from the panels, so what the camera looks at isn't hidden behind them:
 * sideways on wide screens (era card at the start side, meanwhile/key column at the end side on large
 * screens), upward on phones (card at the bottom).
 */
function PanelOffset({ rtl, start, end }: { rtl: boolean; start: boolean; end: boolean }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const { width, height } = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const wide = width >= 640;
    const startShift = wide && start ? Math.min(210, width * 0.16) : 0;
    const endShift = width >= 1024 && end ? 130 : 0;
    const x = (rtl ? 1 : -1) * (startShift - endShift);
    const y = !wide && start ? height * 0.2 : 0;
    camera.setViewOffset(width, height, x, y, width, height);
    camera.updateProjectionMatrix();
    invalidate();
    return () => {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      invalidate();
    };
  }, [camera, width, height, rtl, start, end, invalidate]);
  return null;
}
