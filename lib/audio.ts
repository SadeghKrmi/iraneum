import { existsSync } from "node:fs";
import path from "node:path";
import type { Locale } from "./i18n";

/** Audio formats Ravi can play, in order of preference. */
export const AUDIO_EXTENSIONS = ["mp3", "m4a", "ogg", "wav"] as const;

/** Where the audio for one scene is expected, relative to `public/` (without extension). */
export function audioBasePath(locale: Locale, eraId: string, sceneId: string) {
  return `audio/${locale}/${eraId}/${sceneId}`;
}

/**
 * Finds the narration file for a scene at build time.
 * Returns its public URL, or undefined when no audio has been added yet.
 */
export function findAudio(
  locale: Locale,
  eraId: string,
  sceneId: string,
  publicDir = path.join(process.cwd(), "public"),
): string | undefined {
  const base = audioBasePath(locale, eraId, sceneId);
  const ext = AUDIO_EXTENSIONS.find((e) => existsSync(path.join(publicDir, `${base}.${e}`)));
  return ext ? `/${base}.${ext}` : undefined;
}
