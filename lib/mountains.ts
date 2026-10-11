import data from "@/content/map/mountains.json";
import type { LonLat } from "./geo";
import type { Localized } from "./i18n";

export type MountainRange = {
  id: string;
  name: Localized;
  /** How far peaks spread to each side of the path, in degrees (total width). */
  width: number;
  /** Relative height of the range (1 ≈ an average range). */
  height: number;
  path: LonLat[];
};

export type Peak = { at: LonLat; height: number; radius: number; snowy: boolean };

// The JSON file is checked against this type by tests/unit/mountains.test.ts.
export const mountainRanges = data as unknown as MountainRange[];

/** Small, fast, seedable random numbers, so the same peaks appear on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEG = Math.PI / 180;
/** Distance between rows of peaks along a range, in degrees. */
const STEP = 0.6;

/**
 * Scatters stylized peaks along each range: taller near the range's spine, lower at its edges.
 * Heights and radii are in scene units (the globe's radius is 100).
 */
export function scatterPeaks(ranges: MountainRange[] = mountainRanges, seed = 7): Peak[] {
  const random = mulberry32(seed);
  const peaks: Peak[] = [];
  for (const range of ranges) {
    for (let i = 1; i < range.path.length; i++) {
      const [lon0, lat0] = range.path[i - 1];
      const [lon1, lat1] = range.path[i];
      const k = Math.cos(((lat0 + lat1) / 2) * DEG);
      const dx = (lon1 - lon0) * k;
      const dy = lat1 - lat0;
      const length = Math.hypot(dx, dy) || 1;
      // Unit vector across the range (perpendicular to the path), in "east, north" degrees.
      const across = [-dy / length, dx / length];
      const steps = Math.max(1, Math.round(length / STEP));
      for (let s = 0; s < steps; s++) {
        const t = (s + random()) / steps;
        const perRow = 1 + Math.round(range.width);
        for (let p = 0; p < perRow; p++) {
          const offset = (random() - 0.5) * range.width;
          const centreness = 1 - Math.min(1, Math.abs(offset) / (range.width / 2 + 0.01));
          const height = range.height * (0.5 + 0.5 * centreness) * (0.6 + 0.6 * random()) * 0.8;
          peaks.push({
            at: [lon0 + (lon1 - lon0) * t + (across[0] * offset) / k, lat0 + dy * t + across[1] * offset],
            height,
            radius: 0.45 + height * 0.55,
            snowy: height > 0.95,
          });
        }
      }
    }
  }
  return peaks;
}
