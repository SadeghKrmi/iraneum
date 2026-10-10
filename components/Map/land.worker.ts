/// <reference lib="webworker" />
// Builds the globe's land in the background: triangulating the world's coastlines takes ~1 s on a
// laptop (several on a phone), which would otherwise freeze the page.
import type { GeometryCollection, Topology } from "topojson-specification";
import { feature } from "topojson-client";
import type { MultiPolygon, Polygon } from "geojson";
import { GLOBE_RADIUS, lonLatShapes, shapesOnSphere, toSphere } from "@/lib/geo";
import { LAND_RADIUS } from "./constants";

export type LandBuffers = {
  /** Land surface triangles at LAND_RADIUS, with radial normals. */
  surface: Float32Array;
  normals: Float32Array;
  /** Coastal walls from the ocean up to the land surface. */
  walls: Float32Array;
  /** Coastline as line segments, just above the land. */
  coast: Float32Array;
};

self.onmessage = async (event: MessageEvent<{ url: string }>) => {
  const topology = (await (await fetch(event.data.url)).json()) as Topology<{ land: GeometryCollection }>;
  const land = feature(topology, topology.objects.land);
  const polygons = land.features.flatMap((f) => {
    const g = f.geometry as Polygon | MultiPolygon;
    return g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  });

  const surfaceGeometry = shapesOnSphere(lonLatShapes(polygons), LAND_RADIUS, 6);
  const surface = surfaceGeometry.getAttribute("position").array as Float32Array;
  const normals = surfaceGeometry.getAttribute("normal").array as Float32Array;

  const walls: number[] = [];
  const coast: number[] = [];
  const a0 = toSphere([0, 0]);
  const b0 = toSphere([0, 0]);
  const a1 = toSphere([0, 0]);
  const b1 = toSphere([0, 0]);
  const a2 = toSphere([0, 0]);
  const b2 = toSphere([0, 0]);
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1] as [number, number];
        const b = ring[i] as [number, number];
        toSphere(a, GLOBE_RADIUS - 0.05, a0);
        toSphere(b, GLOBE_RADIUS - 0.05, b0);
        toSphere(a, LAND_RADIUS, a1);
        toSphere(b, LAND_RADIUS, b1);
        walls.push(a0.x, a0.y, a0.z, b0.x, b0.y, b0.z, b1.x, b1.y, b1.z);
        walls.push(a0.x, a0.y, a0.z, b1.x, b1.y, b1.z, a1.x, a1.y, a1.z);
        toSphere(a, LAND_RADIUS + 0.02, a2);
        toSphere(b, LAND_RADIUS + 0.02, b2);
        coast.push(a2.x, a2.y, a2.z, b2.x, b2.y, b2.z);
      }
    }
  }

  const result: LandBuffers = {
    surface,
    normals,
    walls: new Float32Array(walls),
    coast: new Float32Array(coast),
  };
  (self as unknown as Worker).postMessage(result, [
    result.surface.buffer,
    result.normals.buffer,
    result.walls.buffer,
    result.coast.buffer,
  ]);
};
