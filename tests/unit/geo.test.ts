import { geoArea } from "d3-geo";
import { describe, expect, it } from "vitest";
import { eras } from "@/lib/content";
import { fixWinding, toPlane, toShapes } from "@/lib/geo";

describe("map projection", () => {
  it("puts Iran at the centre, east to the right and north away from the viewer", () => {
    const centre = toPlane([52, 32]);
    expect(Math.abs(centre.x)).toBeLessThan(0.01);
    expect(Math.abs(centre.z)).toBeLessThan(0.01);
    expect(toPlane([60, 32]).x).toBeGreaterThan(0); // Herat side is east
    expect(toPlane([52, 38]).z).toBeLessThan(0); // the Caspian is north
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

  it("turn into one solid shape per area", () => {
    for (const era of eras) {
      const shapes = era.territory.flatMap((ring) => toShapes(fixWinding([ring])));
      expect(shapes.length, era.id).toBe(era.territory.length);
      expect(shapes[0].holes.length, era.id).toBe(0);
    }
  });
});
