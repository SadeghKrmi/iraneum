// Types for tts-lib.mjs, so the unit tests can import it.
export type SceneRow = {
  locale: string;
  era: string;
  scene: string;
  output?: string;
  existing: string | null;
  text?: string;
};

export const ROOT: string;
export const LOCALES: string[];
export const AUDIO_EXTENSIONS: string[];
export function listScenes(): Required<SceneRow>[];
export function isWav(buffer: Buffer): boolean;
export function wavDurationSeconds(buffer: Buffer): number;
export function selectScenes<T extends SceneRow>(
  rows: T[],
  options: { locales: string[]; only?: string[]; force?: boolean },
): T[];
