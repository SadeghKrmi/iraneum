import { geoArea, geoBounds, geoCentroid, geoDistance, geoInterpolate } from "d3-geo";
import type { MultiPolygon, Polygon } from "geojson";
import {
  BufferGeometry,
  Float32BufferAttribute,
  ShapeGeometry,
  ShapePath,
  Vector3,
  type Shape,
} from "three";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";

/** A [longitude, latitude] pair, as written in the era files. */
export type LonLat = [number, number];

/** Globe radius in scene units: 1° of arc ≈ 1.75 units. */
export const GLOBE_RADIUS = 100;

const DEG = Math.PI / 180;

/**
 * A point on (or above) the globe. Longitude 0 faces +z, east is +x, north is +y, so the
 * scene's x/y axes match a map's east/north where the camera looks.
 */
export function toSphere([lon, lat]: LonLat, radius = GLOBE_RADIUS, target = new Vector3()): Vector3 {
  const cosLat = Math.cos(lat * DEG);
  return target.set(radius * cosLat * Math.sin(lon * DEG), radius * Math.sin(lat * DEG), radius * cosLat * Math.cos(lon * DEG));
}

/** Unit vectors pointing east and north on the surface at a point. */
export function surfaceFrame([lon, lat]: LonLat) {
  const east = new Vector3(Math.cos(lon * DEG), 0, -Math.sin(lon * DEG));
  const north = new Vector3(
    -Math.sin(lat * DEG) * Math.sin(lon * DEG),
    Math.cos(lat * DEG),
    -Math.sin(lat * DEG) * Math.cos(lon * DEG),
  );
  return { east, north, up: toSphere([lon, lat], 1) };
}

/** Longitude change from `from` to `to` the short way round, in -180…180. */
export function shortestLonDelta(from: number, to: number) {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

/** Wraps a longitude into -180…180. */
export function wrapLon(lon: number) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

/**
 * d3 treats a ring that winds the "wrong" way as covering the rest of the globe.
 * Hand-drawn territories may wind either way, so flip any polygon that covers more than a hemisphere.
 */
export function fixWinding(rings: LonLat[][]): Polygon {
  const closed = rings.map((r) => {
    const [first, last] = [r[0], r[r.length - 1]];
    return first[0] === last[0] && first[1] === last[1] ? r : [...r, first];
  });
  const polygon: Polygon = { type: "Polygon", coordinates: closed };
  if (geoArea(polygon) > 2 * Math.PI) polygon.coordinates = closed.map((r) => [...r].reverse());
  return polygon;
}

function asMulti(rings: LonLat[][]): MultiPolygon {
  return { type: "MultiPolygon", coordinates: rings.map((ring) => fixWinding([ring]).coordinates) };
}

/** Centre of one or more territory rings. */
export function centroidOf(rings: LonLat[][]): LonLat {
  return geoCentroid(asMulti(rings)) as LonLat;
}

/** Larger side of the rings' bounding box, in degrees: how far the camera stands back. */
export function extentOf(rings: LonLat[][]): number {
  const [[west, south], [east, north]] = geoBounds(asMulti(rings));
  const width = east >= west ? east - west : east + 360 - west;
  return Math.max(width * Math.cos(((south + north) / 2) * DEG), north - south);
}

/**
 * Shapes in lon/lat space (x = lon, y = lat). Three.js works out which rings are holes.
 * Polygons are treated as flat in lon/lat, which is how the territories are drawn.
 */
export function lonLatShapes(polygons: number[][][][]): Shape[] {
  const path = new ShapePath();
  for (const polygon of polygons) {
    for (const ring of polygon) {
      path.moveTo(ring[0][0], ring[0][1]);
      for (let i = 1; i < ring.length; i++) path.lineTo(ring[i][0], ring[i][1]);
    }
  }
  return path.toShapes();
}

/**
 * Triangulates shapes and wraps them onto the globe at `radius`. Large triangles are split first
 * (to at most `maxEdgeDegrees` per side) so the surface follows the curve instead of cutting through it.
 */
export function shapesOnSphere(shapes: Shape[], radius: number, maxEdgeDegrees = 2.5): BufferGeometry {
  const flat = new ShapeGeometry(shapes, 1).toNonIndexed();
  const geometry = new TessellateModifier(maxEdgeDegrees, 10).modify(flat);
  flat.dispose();
  const position = geometry.getAttribute("position");
  const normals = new Float32Array(position.count * 3);
  const v = new Vector3();
  for (let i = 0; i < position.count; i++) {
    toSphere([position.getX(i), position.getY(i)], radius, v);
    position.setXYZ(i, v.x, v.y, v.z);
    v.normalize();
    normals.set([v.x, v.y, v.z], i * 3);
  }
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.deleteAttribute("uv");
  geometry.computeBoundingSphere();
  return geometry;
}

/** Adds points so that no step of the ring is longer than `step` degrees (straight in lon/lat). */
export function densify(ring: number[][], step = 1): LonLat[] {
  const out: LonLat[] = [];
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const next = ring[i + 1];
    out.push([lon, lat]);
    if (!next) break;
    const n = Math.ceil(Math.max(Math.abs(next[0] - lon), Math.abs(next[1] - lat)) / step);
    for (let k = 1; k < n; k++) out.push([lon + ((next[0] - lon) * k) / n, lat + ((next[1] - lat) * k) / n]);
  }
  return out;
}

/** A closed copy of a ring (first point repeated at the end). */
export function closeRing<T extends number[]>(ring: T[]): T[] {
  const [first, last] = [ring[0], ring[ring.length - 1]];
  return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first];
}

/** Centre and size (degrees) of a set of points, e.g. a route, to frame it with the camera. */
export function pointsFocus(points: LonLat[]): { centre: LonLat; extent: number } {
  const multi = { type: "MultiPoint" as const, coordinates: points };
  const [[west, south], [east, north]] = geoBounds(multi);
  const width = east >= west ? east - west : east + 360 - west;
  const midLat = (south + north) / 2;
  const centre: LonLat = [wrapLon(west + width / 2), midLat];
  return { centre, extent: Math.max(width * Math.cos(midLat * DEG), north - south) };
}

/**
 * A route as points along great circles, every `step` degrees or less, lifted into a gentle arc
 * (highest in the middle) so it reads clearly above the land and the territory.
 */
export function routeArc(points: LonLat[], baseRadius: number, step = 0.5): Vector3[] {
  const legs: { interpolate: (t: number) => [number, number]; length: number }[] = [];
  for (let i = 1; i < points.length; i++) {
    const length = geoDistance(points[i - 1], points[i]) / DEG;
    legs.push({ interpolate: geoInterpolate(points[i - 1], points[i]), length });
  }
  const total = legs.reduce((sum, leg) => sum + leg.length, 0) || 1;
  const lift = Math.min(5, 0.6 + total * 0.06);
  const out: Vector3[] = [];
  let travelled = 0;
  legs.forEach((leg, i) => {
    const n = Math.max(1, Math.ceil(leg.length / step));
    for (let k = i === 0 ? 0 : 1; k <= n; k++) {
      const t = (travelled + (leg.length * k) / n) / total;
      out.push(toSphere(leg.interpolate(k / n), baseRadius + lift * Math.sin(Math.PI * t)));
    }
    travelled += leg.length;
  });
  return out;
}
