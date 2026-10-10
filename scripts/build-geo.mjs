// Builds public/geo/region.json: Natural Earth land (1:50m) and today's Iran border, clipped to the
// region the atlas shows, so phones don't download the whole world. Run: npm run geo
// Source: world-atlas (Natural Earth, public domain).
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { feature } from "topojson-client";

const ROOT = path.resolve(import.meta.dirname, "..");
const atlas = (name) => JSON.parse(readFileSync(path.join(ROOT, "node_modules/world-atlas", name), "utf8"));

// lon/lat window; generous so its edges stay off-screen.
const BOX = { west: -15, east: 120, south: -8, north: 68 };
const IRAN_ID = "364"; // ISO 3166-1 numeric

/** Sutherland–Hodgman: clips one ring against the lon/lat box. */
function clipRing(ring) {
  const edges = [
    [(p) => p[0] >= BOX.west, (a, b) => cross(a, b, 0, BOX.west)],
    [(p) => p[0] <= BOX.east, (a, b) => cross(a, b, 0, BOX.east)],
    [(p) => p[1] >= BOX.south, (a, b) => cross(a, b, 1, BOX.south)],
    [(p) => p[1] <= BOX.north, (a, b) => cross(a, b, 1, BOX.north)],
  ];
  let out = ring.slice(0, -1);
  for (const [inside, intersect] of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      if (inside(cur)) {
        if (!inside(prev)) out.push(intersect(prev, cur));
        out.push(cur);
      } else if (inside(prev)) out.push(intersect(prev, cur));
    }
    if (!out.length) return null;
  }
  return out.length >= 3 ? [...out, out[0]] : null;
}

function cross(a, b, axis, value) {
  const t = (value - a[axis]) / (b[axis] - a[axis]);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

const round = (ring) => {
  const out = [];
  for (const [x, y] of ring) {
    const p = [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  return out;
};

function clipMultiPolygon(geometry) {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const result = [];
  for (const poly of polys) {
    const outer = clipRing(poly[0]);
    if (!outer) continue;
    const holes = poly.slice(1).map(clipRing).filter(Boolean);
    const rings = [outer, ...holes].map(round).filter((r) => r.length >= 4);
    if (rings.length && rings[0].length >= 4) result.push(rings);
  }
  return result;
}

const landTopo = atlas("land-50m.json");
const land = feature(landTopo, landTopo.objects.land);
const countriesTopo = atlas("countries-50m.json");
const iran = feature(countriesTopo, countriesTopo.objects.countries).features.find((f) => f.id === IRAN_ID);

const region = {
  source: "Natural Earth 1:50m via world-atlas (public domain)",
  land: land.features.flatMap((f) => clipMultiPolygon(f.geometry)),
  iran: clipMultiPolygon(iran.geometry),
};
const file = path.join(ROOT, "public/geo/region.json");
writeFileSync(file, JSON.stringify(region));
console.log(`Wrote ${path.relative(ROOT, file)}: ${region.land.length} land polygons, ${(JSON.stringify(region).length / 1024).toFixed(0)} KB`);
