import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { eras, INTRO_SCENE_ID, reservedSlugs, scenesOf } from "@/lib/content";
import { locales } from "@/lib/i18n";

const slug = /^[a-z0-9-]+$/;
const validYear = (y: number) => Number.isInteger(y) && y !== 0;

describe("eras content", () => {
  it("includes every file in content/eras/", () => {
    const files = readdirSync(path.join(__dirname, "../../content/eras")).filter((f) => f.endsWith(".json"));
    expect(eras.map((e) => `${e.id}.json`).sort()).toEqual(files.sort());
  });

  it("has unique, URL-safe ids that don't clash with other pages", () => {
    const ids = eras.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(slug);
      expect(reservedSlugs as readonly string[]).not.toContain(id);
    }
  });

  it("has valid year ranges", () => {
    for (const e of eras) {
      expect(validYear(e.start) && validYear(e.end), e.id).toBe(true);
      expect(e.end, e.id).toBeGreaterThanOrEqual(e.start);
    }
  });

  it("has events with unique ids, inside the era, in chronological order", () => {
    for (const era of eras) {
      const ids = era.events.map((ev) => ev.id);
      expect(new Set(ids).size, era.id).toBe(ids.length);
      expect(ids, era.id).not.toContain(INTRO_SCENE_ID);
      let previous = -Infinity;
      for (const ev of era.events) {
        expect(ev.id, era.id).toMatch(slug);
        expect(validYear(ev.year), `${era.id}/${ev.id}`).toBe(true);
        expect(ev.year, `${era.id}/${ev.id}`).toBeGreaterThanOrEqual(era.start);
        expect(ev.year, `${era.id}/${ev.id}`).toBeLessThanOrEqual(era.end);
        expect(ev.year, `${era.id}/${ev.id} is out of order`).toBeGreaterThanOrEqual(previous);
        previous = ev.year;
      }
    }
  });

  it("is translated into every language", () => {
    for (const era of eras) {
      for (const scene of scenesOf(era)) {
        for (const locale of locales) {
          expect(scene.title[locale]?.trim(), `${era.id}/${scene.id} title.${locale}`).toBeTruthy();
          expect(scene.text[locale]?.trim(), `${era.id}/${scene.id} text.${locale}`).toBeTruthy();
        }
      }
    }
  });

  it("has complete references", () => {
    for (const era of eras) {
      for (const ref of era.references) {
        expect(ref.title.trim(), era.id).toBeTruthy();
        if (ref.url) expect(ref.url, era.id).toMatch(/^https:\/\//);
      }
    }
  });
});
