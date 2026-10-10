import { eraFiles } from "@/content/eras";
import pages from "@/content/pages.json";
import generalReferences from "@/content/references.json";
import type { Localized } from "./i18n";

export type Reference = {
  author?: string;
  title: string;
  publisher?: string;
  year?: number;
  url?: string;
};

export type EraEvent = {
  /** Stable slug; also names the audio file, e.g. public/audio/en/achaemenid/babylon.mp3 */
  id: string;
  /** Negative numbers are BCE. */
  year: number;
  /** The year is approximate ("c. 547 BCE"). */
  circa?: boolean;
  title: Localized;
  text: Localized;
};

export type Era = {
  /** URL slug, e.g. "achaemenid" → /en/achaemenid/ */
  id: string;
  /** First year of the era; negative numbers are BCE. */
  start: number;
  /** Last year of the era; negative numbers are BCE. */
  end: number;
  title: Localized;
  /** Ravi's introduction to the era (the first scene). */
  summary: Localized;
  /** Marked years inside the era, in chronological order. */
  events: EraEvent[];
  references: Reference[];
};

/** One step of Ravi's story: the era introduction, then each event. */
export type Scene = {
  id: string;
  year: number;
  circa?: boolean;
  title: Localized;
  text: Localized;
};

export const INTRO_SCENE_ID = "intro";

/** Page slugs that live next to era pages, so no era may use them as its id. */
export const reservedSlugs = ["about", "references", "contact", "eras"] as const;

/** All eras in chronological order. */
export const eras: readonly Era[] = [...(eraFiles as Era[])].sort((a, b) => a.start - b.start);

export function getEra(id: string): Era | undefined {
  return eras.find((e) => e.id === id);
}

export function scenesOf(era: Era): Scene[] {
  return [
    { id: INTRO_SCENE_ID, year: era.start, title: era.title, text: era.summary },
    ...era.events.map(({ id, year, circa, title, text }) => ({ id, year, circa, title, text })),
  ];
}

export { generalReferences, pages };
