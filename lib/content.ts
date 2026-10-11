import { eraFiles } from "@/content/eras";
import pages from "@/content/pages.json";
import generalReferences from "@/content/references.json";
import type { LonLat } from "./geo";
import type { Localized } from "./i18n";

export type Reference = {
  author?: string;
  title: string;
  publisher?: string;
  year?: number;
  url?: string;
};

export const eventTypes = ["battle", "monument", "city", "event"] as const;
export type EventType = (typeof eventTypes)[number];

export type Capital = { name: Localized; at: LonLat };

export type EraEvent = {
  /** Stable slug; also names the audio file, e.g. public/audio/en/achaemenid/babylon.mp3 */
  id: string;
  /** Negative numbers are BCE. */
  year: number;
  /** The year is approximate ("c. 547 BCE"). */
  circa?: boolean;
  /** Decides the marker on the map and the tag in the era card. */
  type: EventType;
  /** Where it happened. */
  at: LonLat;
  /** A campaign or journey that leads to the place, drawn as an arrow: start → … → the event's place. */
  route?: LonLat[];
  /** The territory from this event on (rings), or "full" for the era's territory at its height. */
  territory?: LonLat[][] | "full";
  title: Localized;
  text: Localized;
};

export type Era = {
  /** URL slug, e.g. "achaemenid" → /en/achaemenid/ */
  id: string;
  /** First year of the era; negative numbers are BCE. */
  start: number;
  /** Last year of the era; negative numbers are BCE. Left out for an era that continues today. */
  end?: number;
  /** Territory colour on the map. */
  color: string;
  title: Localized;
  /** A shorter name for tight spots (timeline, map label) when the title is long. */
  shortTitle?: Localized;
  /** Ravi's introduction to the era (the first scene). */
  summary: Localized;
  capitals: Capital[];
  rulers: Localized;
  /** Simplified outline(s) of the territory at its height: one ring of [lon, lat] points per area. */
  territory: LonLat[][];
  /** Marked years inside the era, in chronological order. */
  events: EraEvent[];
  references: Reference[];
};

/** One step of Ravi's story: the era introduction, then each event. */
export type Scene = {
  id: string;
  year: number;
  circa?: boolean;
  /** Missing for the era introduction. */
  type?: EventType;
  at?: LonLat;
  route?: LonLat[];
  title: Localized;
  text: Localized;
};

export const INTRO_SCENE_ID = "intro";

/** Page slugs that live next to era pages, so no era may use them as its id. */
export const reservedSlugs = ["about", "references", "contact", "eras"] as const;

/** All eras in chronological order. */
// The JSON files are checked against these types by tests/unit/content.test.ts.
export const eras: readonly Era[] = [...(eraFiles as unknown as Era[])].sort((a, b) => a.start - b.start);

/** The era's last year, or the current year for an era that continues today. */
export function eraEnd(era: Era): number {
  return era.end ?? new Date().getFullYear();
}

export function shortTitleOf(era: Era): Localized {
  return era.shortTitle ?? era.title;
}

export function getEra(id: string): Era | undefined {
  return eras.find((e) => e.id === id);
}

export function scenesOf(era: Era): Scene[] {
  return [
    { id: INTRO_SCENE_ID, year: era.start, title: era.title, text: era.summary },
    ...era.events.map(({ id, year, circa, type, at, route, title, text }) => ({
      id,
      year,
      circa,
      type,
      at,
      route,
      title,
      text,
    })),
  ];
}

/**
 * The territory to show at a scene (0 = the era's intro): the latest border change up to that event,
 * or the era at its height. `key` changes whenever the shape does (for fades and tests).
 */
export function territoryAt(era: Era, sceneIndex: number): { key: string; rings: LonLat[][] } {
  for (let i = Math.min(sceneIndex, era.events.length) - 1; i >= 0; i--) {
    const t = era.events[i].territory;
    if (t === "full") return { key: era.id, rings: era.territory };
    if (t) return { key: `${era.id}/${era.events[i].id}`, rings: t };
  }
  return { key: era.id, rings: era.territory };
}

export { generalReferences, pages };
