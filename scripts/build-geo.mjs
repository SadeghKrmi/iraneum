// Builds the globe's base data in public/geo/ from world-atlas (Natural Earth, public domain):
//   land-50m.json  whole-world land at 1:50m, as compact TopoJSON (decoded in the browser)
//   iran.json      today's borders of Iran, as GeoJSON MultiPolygon coordinates
// Run: npm run geo
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { feature } from "topojson-client";

const ROOT = path.resolve(import.meta.dirname, "..");
const ATLAS = path.join(ROOT, "node_modules/world-atlas");
const OUT = path.join(ROOT, "public/geo");
const IRAN_ID = "364"; // ISO 3166-1 numeric

mkdirSync(OUT, { recursive: true });
copyFileSync(path.join(ATLAS, "land-50m.json"), path.join(OUT, "land-50m.json"));

const countries = JSON.parse(readFileSync(path.join(ATLAS, "countries-50m.json"), "utf8"));
const iran = feature(countries, countries.objects.countries).features.find((f) => f.id === IRAN_ID);
const coordinates = iran.geometry.type === "Polygon" ? [iran.geometry.coordinates] : iran.geometry.coordinates;
const round = (n) => Math.round(n * 100) / 100;
writeFileSync(
  path.join(OUT, "iran.json"),
  JSON.stringify(coordinates.map((poly) => poly.map((ring) => ring.map(([x, y]) => [round(x), round(y)])))),
);
console.log("Wrote public/geo/land-50m.json and public/geo/iran.json");
