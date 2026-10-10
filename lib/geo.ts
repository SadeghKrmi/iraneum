import { geoArea, geoCentroid, geoConicConformal, geoPath, type GeoContext } from "d3-geo";
import type { MultiPolygon, Polygon } from "geojson";
import { ShapePath, type Shape } from "three";

/** A [longitude, latitude] pair, as written in the era files. */
export type LonLat = [number, number];

/** Map units per radian. The region from Greece to the Indus is ~130 units wide. */
const SCALE = 100;

/** Conformal conic projection centred on Iran, so shapes there look right. */
export const projection = geoConicConformal()
  .rotate([-52, 0])
  .center([0, 32])
  .parallels([25, 40])
  .scale(SCALE)
  .translate([0, 0])
  .precision(0.1);

/**
 * Projects lon/lat onto the map plane. Three.js uses x to the east and z toward the viewer (south),
 * so d3's screen-style y (down = south) becomes z directly.
 */
export function toPlane([lon, lat]: LonLat): { x: number; z: number } {
  const [x, y] = projection([lon, lat]) ?? [0, 0];
  return { x, z: y };
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

/**
 * Converts polygons to Three.js shapes in the map plane (shape x = east, shape y = north,
 * so rotating the mesh by -90° about X lays it flat with north away from the viewer).
 */
export function toShapes(geometry: Polygon | MultiPolygon): Shape[] {
  const shapePath = new ShapePath();
  const context = pathContext(
    (x, y) => void shapePath.moveTo(x, -y),
    (x, y) => void shapePath.lineTo(x, -y),
  );
  // geoPath writes each ring as moveTo + lineTo…; ShapePath works out which rings are holes.
  geoPath(projection, context)(geometry);
  return shapePath.toShapes();
}

/** A drawing context for d3's geoPath that only records rings. */
function pathContext(
  moveTo: (x: number, y: number) => void,
  lineTo: (x: number, y: number) => void,
  closePath: () => void = () => {},
): GeoContext {
  return { beginPath: () => {}, moveTo, lineTo, closePath, arc: () => {} };
}

/** Each ring as a list of projected points, for outlines. */
export function toOutlines(geometry: Polygon | MultiPolygon): { x: number; z: number }[][] {
  const rings: { x: number; z: number }[][] = [];
  const context = pathContext(
    (x, y) => void rings.push([{ x, z: y }]),
    (x, y) => void rings[rings.length - 1].push({ x, z: y }),
    () => {
      const ring = rings[rings.length - 1];
      if (ring?.length) ring.push(ring[0]);
    },
  );
  geoPath(projection, context)(geometry);
  return rings;
}

export function centroidOf(polygons: Polygon[]): LonLat {
  const multi: MultiPolygon = { type: "MultiPolygon", coordinates: polygons.map((p) => p.coordinates) };
  return geoCentroid(multi) as LonLat;
}

/** Size of the projected bounding box, used to choose how far the camera stands back. */
export function projectedSize(polygons: Polygon[]): number {
  const multi: MultiPolygon = { type: "MultiPolygon", coordinates: polygons.map((p) => p.coordinates) };
  const [[x0, y0], [x1, y1]] = geoPath(projection).bounds(multi);
  return Math.max(x1 - x0, y1 - y0);
}
