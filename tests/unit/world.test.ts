import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n";
import { worldAt, worldCivilizations } from "@/lib/world";

const validPoint = (p: unknown) =>
  Array.isArray(p) && p.length === 2 && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;

describe("world civilizations", () => {
  it("have unique ids and valid periods and colours", () => {
    const ids = worldCivilizations.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of worldCivilizations) {
      if (c.to !== undefined) expect(c.from, c.id).toBeLessThan(c.to);
      expect(c.color, c.id).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("are written in both languages", () => {
    for (const c of worldCivilizations) {
      for (const locale of locales) {
        expect(c.name[locale].trim(), `${c.id} name.${locale}`).not.toBe("");
        expect(c.summary[locale].trim(), `${c.id} summary.${locale}`).not.toBe("");
        expect(c.capital.name[locale].trim(), `${c.id} capital.${locale}`).not.toBe("");
      }
    }
  });

  it("have a valid capital and territory", () => {
    for (const c of worldCivilizations) {
      expect(validPoint(c.capital.at), c.id).toBe(true);
      expect(c.territory.length, c.id).toBeGreaterThan(0);
      for (const ring of c.territory) {
        expect(ring.length, c.id).toBeGreaterThanOrEqual(3);
        for (const p of ring) expect(validPoint(p), c.id).toBe(true);
      }
    }
  });
});

describe("worldAt", () => {
  const ids = (year: number) => worldAt(year).map((c) => c.id);

  it("lists the civilizations of a year", () => {
    expect(ids(-480)).toEqual(expect.arrayContaining(["greek-poleis", "rome-republic", "zhou"]));
    expect(ids(1979)).toEqual(expect.arrayContaining(["usa", "ussr", "prc"]));
    expect(ids(1979)).not.toContain("rome-republic");
  });

  it("treats the end year as exclusive and sorts west to east", () => {
    const list = worldAt(0, [
      { ...worldCivilizations[0], id: "east", from: -10, to: 10, capital: { ...worldCivilizations[0].capital, at: [100, 0] } },
      { ...worldCivilizations[0], id: "west", from: -10, to: undefined, capital: { ...worldCivilizations[0].capital, at: [-50, 0] } },
      { ...worldCivilizations[0], id: "ended", from: -10, to: 0 },
    ]);
    expect(list.map((c) => c.id)).toEqual(["west", "east"]);
  });
});
