import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n";
import { worldAt, worldCivilizations, worldTerritory } from "@/lib/world";

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
      for (const rings of [c.territory, ...(c.stages ?? []).map((s) => s.territory)]) {
        expect(rings.length, c.id).toBeGreaterThan(0);
        for (const ring of rings) {
          expect(ring.length, c.id).toBeGreaterThanOrEqual(3);
          for (const p of ring) expect(validPoint(p), c.id).toBe(true);
        }
      }
    }
  });

  it("cover every part of the world", () => {
    expect(worldCivilizations.length).toBeGreaterThanOrEqual(150);
    const capitals = worldCivilizations.map((c) => c.capital.at);
    const region = (lon: [number, number], lat: [number, number]) =>
      capitals.filter(([x, y]) => x >= lon[0] && x <= lon[1] && y >= lat[0] && y <= lat[1]).length;
    expect(region([-170, -30], [-60, 75]), "the Americas").toBeGreaterThanOrEqual(15);
    expect(region([-20, 55], [-40, 20]), "Africa").toBeGreaterThanOrEqual(12);
    expect(region([-12, 40], [35, 72]), "Europe").toBeGreaterThanOrEqual(20);
    expect(region([95, 150], [-12, 55]), "East and South-East Asia").toBeGreaterThanOrEqual(25);
  });

  it("change borders in order, within their own lifetime", () => {
    const staged = worldCivilizations.filter((c) => c.stages);
    expect(staged.length).toBeGreaterThanOrEqual(15);
    for (const c of staged) {
      const years = c.stages!.map((s) => s.from);
      expect(years, c.id).toEqual([...years].sort((a, b) => a - b));
      expect(new Set(years).size, c.id).toBe(years.length);
      for (const y of years) {
        expect(y, c.id).toBeGreaterThanOrEqual(c.from);
        if (c.to !== undefined) expect(y, c.id).toBeLessThan(c.to);
      }
    }
  });
});

describe("worldTerritory", () => {
  const ottoman = worldCivilizations.find((c) => c.id === "ottoman")!;

  it("picks the latest border stage up to the year", () => {
    expect(worldTerritory(ottoman, 1300).key).toBe("ottoman@1299");
    expect(worldTerritory(ottoman, 1514).key).toBe("ottoman@1453");
    expect(worldTerritory(ottoman, 1517).key).toBe("ottoman@1517");
    expect(worldTerritory(ottoman, 1683).key).toBe("ottoman@1534");
    expect(worldTerritory(ottoman, 1683).rings).toBe(ottoman.stages!.find((s) => s.from === 1534)!.territory);
  });

  it("uses the main territory when nothing has changed yet, or there are no stages", () => {
    const ussr = worldCivilizations.find((c) => c.id === "ussr")!;
    expect(worldTerritory(ussr, 1950)).toEqual({ key: "ussr", rings: ussr.territory });
    const fake = { ...ottoman, stages: [{ from: 1500, territory: [] }] };
    expect(worldTerritory(fake, 1400)).toEqual({ key: "ottoman", rings: ottoman.territory });
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
    const list = worldAt(0, undefined, [
      { ...worldCivilizations[0], id: "east", from: -10, to: 10, capital: { ...worldCivilizations[0].capital, at: [100, 0] } },
      { ...worldCivilizations[0], id: "west", from: -10, to: undefined, capital: { ...worldCivilizations[0].capital, at: [-50, 0] } },
      { ...worldCivilizations[0], id: "ended", from: -10, to: 0 },
    ]);
    expect(list.map((c) => c.id)).toEqual(["west", "east"]);
  });

  it("lists the nearest first when given a place", () => {
    const fromIsfahan = worldAt(1639, [51.67, 32.65]).map((c) => c.id);
    expect(fromIsfahan.slice(0, 4)).toEqual(expect.arrayContaining(["ottoman", "bukhara-khanate"]));
    expect(fromIsfahan.indexOf("ottoman")).toBeLessThan(fromIsfahan.indexOf("new-spain"));
    expect(new Set(fromIsfahan)).toEqual(new Set(worldAt(1639).map((c) => c.id)));
  });
});
