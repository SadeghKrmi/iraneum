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
