import { geoDistance } from "d3-geo";
import { describe, expect, it } from "vitest";
import { eras, getEra, territoryAt } from "@/lib/content";
import { routeArc, type LonLat } from "@/lib/geo";
import { mountainRanges, scatterPeaks } from "@/lib/mountains";
import { locales } from "@/lib/i18n";

const DEG = Math.PI / 180;
const validPoint = (p: unknown) =>
  Array.isArray(p) && p.length === 2 && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;

describe("campaign routes", () => {
  const routed = eras.flatMap((era) => era.events.filter((ev) => ev.route).map((ev) => ({ era, ev })));

  it("exist for many events", () => {
    expect(routed.length).toBeGreaterThanOrEqual(25);
  });

  it("have at least two valid points and start or end at the event's place", () => {
    for (const { era, ev } of routed) {
      const route = ev.route!;
      expect(route.length, `${era.id}/${ev.id}`).toBeGreaterThanOrEqual(2);
      for (const p of route) expect(validPoint(p), `${era.id}/${ev.id}`).toBe(true);
      // Most routes lead to the event; a few start there (a campaign that sets out from it).
      const miss =
        Math.min(geoDistance(route[route.length - 1], ev.at), geoDistance(route[0], ev.at)) / DEG;
      expect(miss, `${era.id}/${ev.id} is ${miss.toFixed(1)}° from its place`).toBeLessThan(0.6);
    }
  });

  it("arc above the globe and keep their ends", () => {
    const path = routeArc(
      [
        [28.04, 38.49],
        [23.5, 37.95],
      ],
      100,
    );
    expect(path.length).toBeGreaterThan(5);
    const mid = path[Math.floor(path.length / 2)];
    expect(mid.length()).toBeGreaterThan(100.5);
    expect(path[0].length()).toBeCloseTo(100, 3);
  });
});

describe("border changes within an era", () => {
  it("use valid rings or 'full'", () => {
    for (const era of eras) {
      for (const ev of era.events) {
        if (!ev.territory || ev.territory === "full") continue;
        for (const ring of ev.territory) {
          expect(ring.length, `${era.id}/${ev.id}`).toBeGreaterThanOrEqual(3);
          for (const p of ring) expect(validPoint(p), `${era.id}/${ev.id}`).toBe(true);
        }
      }
    }
  });

  it("show the latest change up to the current scene", () => {
    const achaemenid = getEra("achaemenid")!;
    const at = (id: string | null) =>
      territoryAt(achaemenid, id === null ? 0 : achaemenid.events.findIndex((e) => e.id === id) + 1).key;
    expect(at(null)).toBe("achaemenid"); // the overview shows the empire at its height
    expect(at("cyrus-defeats-media")).toBe("achaemenid/cyrus-defeats-media");
    expect(at("fall-of-sardis")).toBe("achaemenid/fall-of-sardis");
    expect(at("babylon")).toBe("achaemenid/babylon");
    expect(at("cambyses-egypt")).toBe("achaemenid/cambyses-egypt");
    expect(at("darius-behistun")).toBe("achaemenid");
    expect(at("alexander")).toBe("achaemenid");
  });

  it("fall back to the era's territory where nothing changes", () => {
    const pahlavi = getEra("pahlavi")!;
    expect(territoryAt(pahlavi, 3)).toEqual({ key: "pahlavi", rings: pahlavi.territory });
    // Parthia's height ("full") from Mithridates II on.
    const parthian = getEra("parthian")!;
    expect(territoryAt(parthian, 1).key).toBe("parthian/arsacid-era");
    expect(territoryAt(parthian, 3)).toEqual({ key: "parthian", rings: parthian.territory });
  });

  it("are drawn for every era whose borders moved", () => {
    const staged = eras.filter((era) => era.events.some((ev) => ev.territory)).map((era) => era.id);
    expect(staged).toHaveLength(12);
    expect(staged).not.toContain("pahlavi");
    expect(staged).not.toContain("islamic-republic");
  });
});

describe("mountains", () => {
  it("have named ranges with valid paths", () => {
    const ids = new Set<string>();
    for (const range of mountainRanges) {
      expect(ids.has(range.id), range.id).toBe(false);
      ids.add(range.id);
      for (const locale of locales) expect(range.name[locale]?.trim(), range.id).toBeTruthy();
      expect(range.path.length, range.id).toBeGreaterThanOrEqual(2);
      for (const p of range.path) expect(validPoint(p), range.id).toBe(true);
      expect(range.width, range.id).toBeGreaterThan(0);
      expect(range.height, range.id).toBeGreaterThan(0);
    }
  });

  it("scatter the same peaks every time, in sensible numbers", () => {
    const a = scatterPeaks();
    const b = scatterPeaks();
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(500);
    expect(a.length).toBeLessThan(5000);
    for (const p of a) {
      expect(validPoint(p.at as LonLat)).toBe(true);
      expect(p.height).toBeGreaterThan(0);
    }
  });
});
