import { geoDistance } from "d3-geo";
import data from "@/content/world/civilizations.json";
import type { LonLat } from "./geo";
import type { Localized } from "./i18n";

/** Another civilization or power, for one period of its history. */
export type WorldCivilization = {
  id: string;
  /** Map colour; periods of the same civilization share one. */
  color: string;
  /** First year (negative = BCE). */
  from: number;
  /** The year it ended (exclusive); left out if it still exists. */
  to?: number;
  name: Localized;
  summary: Localized;
  capital: { name: Localized; at: LonLat };
  /** Simplified territory at its height: one ring of [lon, lat] points per area (drawn on land only). */
  territory: LonLat[][];
  /** Borders that changed during its life: each one holds from its year until the next (sorted by year). */
  stages?: { from: number; territory: LonLat[][] }[];
};

// The JSON file is checked against this type by tests/unit/world.test.ts.
export const worldCivilizations = data as unknown as WorldCivilization[];

/**
 * Civilizations that existed in a given year: nearest first when `near` is given (by their capitals),
 * otherwise west to east.
 */
export function worldAt(
  year: number,
  near?: LonLat,
  all: readonly WorldCivilization[] = worldCivilizations,
): WorldCivilization[] {
  const alive = all.filter((c) => c.from <= year && (c.to === undefined || year < c.to));
  if (!near) return alive.sort((a, b) => a.capital.at[0] - b.capital.at[0]);
  const distance = new Map(alive.map((c) => [c, geoDistance(c.capital.at, near)]));
  return alive.sort((a, b) => distance.get(a)! - distance.get(b)!);
}

/**
 * A civilization's territory in a given year: the latest border stage up to that year, or its main territory.
 * The key changes with the stage, so the map fades the new border in.
 */
export function worldTerritory(c: WorldCivilization, year: number): { key: string; rings: LonLat[][] } {
  const stage = c.stages?.findLast((s) => s.from <= year);
  return stage ? { key: `${c.id}@${stage.from}`, rings: stage.territory } : { key: c.id, rings: c.territory };
}
