// Reports which scenes still need audio, and audio files that match no scene (e.g. after renaming an event).
import { readdirSync } from "node:fs";
import path from "node:path";
import { ROOT, listScenes } from "./tts-lib.mjs";

const rows = listScenes();
const missing = rows.filter((r) => !r.existing);
const expected = new Set(rows.map((r) => r.output.replace(/\.mp3$/, "")));

const audioDir = path.join(ROOT, "public/audio");
const orphans = [];
try {
  for (const file of readdirSync(audioDir, { recursive: true })) {
    const rel = `public/audio/${String(file).split(path.sep).join("/")}`;
    if (/\.(mp3|m4a|ogg|wav)$/.test(rel) && !expected.has(rel.replace(/\.\w+$/, ""))) orphans.push(rel);
  }
} catch {
  // No public/audio folder yet.
}

console.log(`Audio: ${rows.length - missing.length}/${rows.length} scenes have narration.`);
if (missing.length) {
  console.log(`\nMissing (${missing.length}):`);
  for (const r of missing) console.log(`  ${r.output}`);
}
if (orphans.length) {
  console.log(`\nNot used by any scene (${orphans.length}):`);
  for (const o of orphans) console.log(`  ${o}`);
  process.exitCode = 1;
}
