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
};

// The JSON file is checked against this type by tests/unit/world.test.ts.
export const worldCivilizations = data as unknown as WorldCivilization[];

/** Civilizations that existed in a given year, west to east. */
export function worldAt(year: number, all: readonly WorldCivilization[] = worldCivilizations): WorldCivilization[] {
  return all
    .filter((c) => c.from <= year && (c.to === undefined || year < c.to))
    .sort((a, b) => a.capital.at[0] - b.capital.at[0]);
}
