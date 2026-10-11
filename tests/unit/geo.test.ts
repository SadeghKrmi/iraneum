import { readFileSync } from "node:fs";
import path from "node:path";
import { geoArea, geoContains } from "d3-geo";
import type { FeatureCollection } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { describe, expect, it } from "vitest";
import { eras } from "@/lib/content";
import {
  GLOBE_RADIUS,
  centroidOf,
  closeRing,
  containsPoint,
  densify,
  extentOf,
  fixWinding,
  lonLatOf,
  lonLatShapes,
  shapesOnSphere,
  shortestLonDelta,
  smallestContaining,
  toSphere,
  wrapLon,
  type LonLat,
} from "@/lib/geo";

describe("globe coordinates", () => {
  it("puts points on the sphere: lon 0 faces +z, east is +x, north is +y", () => {
    const p = toSphere([0, 0]);
    expect(p.length()).toBeCloseTo(GLOBE_RADIUS);
    expect(p.z).toBeCloseTo(GLOBE_RADIUS);
    expect(toSphere([90, 0]).x).toBeCloseTo(GLOBE_RADIUS);
    expect(toSphere([0, 90]).y).toBeCloseTo(GLOBE_RADIUS);
    expect(toSphere([52, 32], 120).length()).toBeCloseTo(120);
  });

  it("goes the short way round the date line", () => {
    expect(shortestLonDelta(170, -170)).toBeCloseTo(20);
    expect(shortestLonDelta(-170, 170)).toBeCloseTo(-20);
    expect(shortestLonDelta(52, 60)).toBeCloseTo(8);
    expect(wrapLon(190)).toBeCloseTo(-170);
    expect(wrapLon(-190)).toBeCloseTo(170);
  });

  it("densifies rings so outlines follow the surface", () => {
    const ring = densify([
      [0, 0],
      [10, 0],
    ]);
    expect(ring.length).toBe(11);
    expect(ring[5]).toEqual([5, 0]);
  });
});

describe("territories", () => {
  it("cover less than a hemisphere whichever way their rings were drawn", () => {
    for (const era of eras) {
      for (const ring of era.territory) {
        expect(geoArea(fixWinding([ring])), era.id).toBeLessThan(2 * Math.PI);
        expect(geoArea(fixWinding([[...ring].reverse()])), era.id).toBeLessThan(2 * Math.PI);
      }
    }
  });

  it("turn into one solid shape per area, wrapped onto the globe", () => {
    for (const era of eras) {
      const shapes = lonLatShapes(era.territory.map((ring) => [closeRing(ring)]));
      expect(shapes.length, era.id).toBe(era.territory.length);
      expect(shapes[0].holes.length, era.id).toBe(0);
      const geometry = shapesOnSphere(shapes, 101);
      const position = geometry.getAttribute("position");
      expect(position.count, era.id).toBeGreaterThan(0);
      for (let i = 0; i < position.count; i += 97) {
        const r = Math.hypot(position.getX(i), position.getY(i), position.getZ(i));
        expect(r, era.id).toBeCloseTo(101, 3);
      }
    }
  });

  it("have a centre inside the region and a sensible size", () => {
    const achaemenid = eras.find((e) => e.id === "achaemenid")!;
    const [lon, lat] = centroidOf(achaemenid.territory);
    expect(lon).toBeGreaterThan(35);
    expect(lon).toBeLessThan(60);
    expect(lat).toBeGreaterThan(25);
    expect(lat).toBeLessThan(42);
    expect(extentOf(achaemenid.territory)).toBeGreaterThan(30);
  });
});

describe("world land data", () => {
  const file = path.join(__dirname, "../../public/geo/land-50m.json");
  const topology = JSON.parse(readFileSync(file, "utf8")) as Topology<{ land: GeometryCollection }>;
  const land = feature(topology, topology.objects.land) as FeatureCollection;

  it.each([
    ["Iran", [53, 32]],
    ["North America", [-100, 40]],
    ["South America", [-60, -10]],
    ["Australia", [134, -25]],
    ["Africa", [20, 5]],
  ])("covers %s", (_, point) => {
    expect(land.features.some((f) => geoContains(f, point as [number, number]))).toBe(true);
  });
});

describe("picking on the globe", () => {
  it("turns a point on the globe back into longitude and latitude", () => {
    for (const p of [[52, 30], [-75.5, 40.2], [139.7, -35.7], [0, 0], [179, 60]] as LonLat[]) {
      const [lon, lat] = lonLatOf(toSphere(p, 123));
      expect(lon).toBeCloseTo(p[0], 6);
      expect(lat).toBeCloseTo(p[1], 6);
    }
  });

  const square = (lon: number, lat: number, size: number): LonLat[] => [
    [lon, lat], [lon + size, lat], [lon + size, lat + size], [lon, lat + size],
  ];

  it("finds a point inside a ring drawn either way round", () => {
    const ring = square(40, 30, 10);
    expect(containsPoint([ring], [45, 35])).toBe(true);
    expect(containsPoint([[...ring].reverse()], [45, 35])).toBe(true);
    expect(containsPoint([ring], [55, 35])).toBe(false);
    expect(containsPoint([square(0, 0, 2), ring], [45, 35])).toBe(true);
  });

  it("picks the smallest territory under the point", () => {
    const entries = [
      { id: "empire", rings: [square(30, 20, 30)] },
      { id: "kingdom", rings: [square(40, 30, 5)] },
    ];
    expect(smallestContaining(entries, [42, 32])).toBe("kingdom");
    expect(smallestContaining(entries, [55, 45])).toBe("empire");
    expect(smallestContaining(entries, [-10, 0])).toBeNull();
  });
});
