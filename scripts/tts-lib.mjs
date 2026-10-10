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
