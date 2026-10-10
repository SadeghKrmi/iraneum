import rawCheckpoints from "@/content/checkpoints.json";
import type { Localized } from "./i18n";

export type Checkpoint = {
  /** URL slug, e.g. "achaemenid" → /en/achaemenid/ */
  id: string;
  /** First year of the era; negative numbers are BCE. */
  start: number;
  /** Last year of the era; negative numbers are BCE. */
  end: number;
  title: Localized;
  summary: Localized;
};

/** All checkpoints in chronological order. */
export const checkpoints: readonly Checkpoint[] = [...(rawCheckpoints as Checkpoint[])].sort(
  (a, b) => a.start - b.start,
);

export function getCheckpoint(id: string): Checkpoint | undefined {
  return checkpoints.find((c) => c.id === id);
}
