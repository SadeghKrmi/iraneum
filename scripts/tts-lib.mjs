// Shared helpers for the TTS scripts: which texts Ravi speaks, and where each audio file belongs.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const LOCALES = ["fa", "en"];
export const AUDIO_EXTENSIONS = ["mp3", "m4a", "ogg", "wav"];

/** Every scene of every era, per language, with the path its audio file should be saved to. */
export function listScenes() {
  const dir = path.join(ROOT, "content/eras");
  const eras = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")))
    .sort((a, b) => a.start - b.start);

  const rows = [];
  for (const locale of LOCALES) {
    for (const era of eras) {
      const scenes = [{ id: "intro", title: era.title, text: era.summary }, ...era.events];
      for (const scene of scenes) {
        const base = `public/audio/${locale}/${era.id}/${scene.id}`;
        const existing = AUDIO_EXTENSIONS.map((ext) => `${base}.${ext}`).find((p) =>
          existsSync(path.join(ROOT, p)),
        );
        rows.push({
          locale,
          era: era.id,
          scene: scene.id,
          output: `${base}.mp3`,
          existing: existing ?? null,
          // The title is read first, then the story text.
          text: `${scene.title[locale]}. ${scene.text[locale]}`.replace(/\s+/g, " ").trim(),
        });
      }
    }
  }
  return rows;
}

/** Whether a buffer holds a WAV file ("RIFF" … "WAVE") with more than a bare header. */
export function isWav(buffer) {
  return (
    buffer.length > 44 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WAVE"
  );
}

/** Length of a WAV file in seconds, from its "fmt " chunk (byte rate) and "data" chunk (size). */
export function wavDurationSeconds(buffer) {
  let byteRate = 0;
  for (let offset = 12; offset + 8 <= buffer.length; ) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "fmt ") byteRate = buffer.readUInt32LE(offset + 16);
    if (id === "data") {
      // Streaming servers sometimes write a placeholder size: fall back to what is actually there.
      const dataSize = Math.min(size, buffer.length - offset - 8);
      return byteRate ? dataSize / byteRate : 0;
    }
    offset += 8 + size + (size % 2);
  }
  return 0;
}

/**
 * The scenes to synthesize: in the given languages, limited to `only` ("<era>" or "<era>/<scene>") when given,
 * and without those that already have audio unless `force` is set.
 */
export function selectScenes(rows, { locales, only = [], force = false }) {
  return rows.filter(
    (r) =>
      locales.includes(r.locale) &&
      (only.length === 0 || only.some((o) => o === r.era || o === `${r.era}/${r.scene}`)) &&
      (force || !r.existing),
  );
}
