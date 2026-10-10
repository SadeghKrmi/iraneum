// Writes every text Ravi speaks, with the file path each audio must be saved to, into tts/.
// Usage: npm run tts:export            (all scenes)
//        npm run tts:export -- --missing  (only scenes without audio yet)
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LOCALES, ROOT, listScenes } from "./tts-lib.mjs";

const onlyMissing = process.argv.includes("--missing");
const rows = listScenes().filter((r) => !onlyMissing || !r.existing);
const outDir = path.join(ROOT, "tts");
mkdirSync(outDir, { recursive: true });

writeFileSync(path.join(outDir, "script.json"), JSON.stringify(rows, null, 2) + "\n");
for (const locale of LOCALES) {
  const lines = rows.filter((r) => r.locale === locale).map((r) => `${r.output}\t${r.text}`);
  writeFileSync(path.join(outDir, `${locale}.tsv`), ["output\ttext", ...lines].join("\n") + "\n");
}

const missing = rows.filter((r) => !r.existing).length;
console.log(`Exported ${rows.length} scenes (${missing} without audio) to tts/script.json, tts/fa.tsv, tts/en.tsv`);
