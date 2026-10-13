import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findAudio } from "@/lib/audio";

describe("findAudio", () => {
  const publicDir = mkdtempSync(path.join(tmpdir(), "iraneum-audio-"));
  mkdirSync(path.join(publicDir, "audio/fa/achaemenid"), { recursive: true });
  writeFileSync(path.join(publicDir, "audio/fa/achaemenid/babylon.wav"), "");

  it("finds a scene's audio in any supported format", () => {
    expect(findAudio("fa", "achaemenid", "babylon", publicDir)).toBe("/audio/fa/achaemenid/babylon.wav");
  });

  it("returns undefined when the audio has not been added", () => {
    expect(findAudio("en", "achaemenid", "babylon", publicDir)).toBeUndefined();
    expect(findAudio("fa", "achaemenid", "intro", publicDir)).toBeUndefined();
  });
});

describe("TTS helpers", async () => {
  // The TTS scripts are plain Node modules next to package.json.
  const { isWav, selectScenes, wavDurationSeconds } = await import("../../scripts/tts-lib.mjs");

  /** A minimal PCM WAV: mono, 16-bit, `rate` samples per second, `seconds` long. */
  const wav = (seconds: number, rate = 8000) => {
    const data = Buffer.alloc(Math.round(seconds * rate) * 2);
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + data.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(rate, 24);
    header.writeUInt32LE(rate * 2, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write("data", 36);
    header.writeUInt32LE(data.length, 40);
    return Buffer.concat([header, data]);
  };

  it("recognizes WAV files and measures their length", () => {
    expect(isWav(wav(1.5))).toBe(true);
    expect(isWav(Buffer.from('{"detail":"voice not found"}'))).toBe(false);
    expect(isWav(wav(0).subarray(0, 44))).toBe(false); // a header without sound
    expect(wavDurationSeconds(wav(1.5))).toBeCloseTo(1.5, 3);
  });

  const rows = [
    { locale: "fa", era: "achaemenid", scene: "intro", existing: null },
    { locale: "fa", era: "achaemenid", scene: "babylon", existing: "public/audio/fa/achaemenid/babylon.mp3" },
    { locale: "en", era: "achaemenid", scene: "babylon", existing: null },
    { locale: "fa", era: "parthian", scene: "carrhae", existing: null },
  ];
  const ids = (list: typeof rows) => list.map((r) => `${r.locale} ${r.era}/${r.scene}`);

  it("selects the scenes still missing audio, by language, era or scene", () => {
    expect(ids(selectScenes(rows, { locales: ["fa"] }))).toEqual(["fa achaemenid/intro", "fa parthian/carrhae"]);
    expect(ids(selectScenes(rows, { locales: ["fa", "en"], only: ["achaemenid/babylon"] }))).toEqual([
      "en achaemenid/babylon",
    ]);
    expect(ids(selectScenes(rows, { locales: ["fa"], only: ["achaemenid"], force: true }))).toEqual([
      "fa achaemenid/intro",
      "fa achaemenid/babylon",
    ]);
  });
});
