import { describe, expect, it } from "vitest";
import { checkpoints } from "@/lib/content";
import { locales } from "@/lib/i18n";

describe("checkpoints content", () => {
  it("has unique, URL-safe ids", () => {
    const ids = checkpoints.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("has valid year ranges", () => {
    for (const c of checkpoints) {
      expect(Number.isInteger(c.start) && c.start !== 0, c.id).toBe(true);
      expect(Number.isInteger(c.end) && c.end !== 0, c.id).toBe(true);
      expect(c.end, c.id).toBeGreaterThanOrEqual(c.start);
    }
  });

  it("is translated into every language", () => {
    for (const c of checkpoints) {
      for (const locale of locales) {
        expect(c.title[locale]?.trim(), `${c.id} title.${locale}`).toBeTruthy();
        expect(c.summary[locale]?.trim(), `${c.id} summary.${locale}`).toBeTruthy();
      }
    }
  });
});
