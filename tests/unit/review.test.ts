import { describe, expect, it } from "vitest";
import mountains from "@/content/map/mountains.json";
import { eras, pages } from "@/lib/content";
import { containsPoint } from "@/lib/geo";
import { getDictionary } from "@/lib/i18n";
import { worldCivilizations } from "@/lib/world";

/** Every Persian string on the site, with where it comes from. */
function persianTexts(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const walk = (value: unknown, where: string) => {
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${where}[${i}]`));
    else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) {
        if (k === "fa" && typeof v === "string") out.push({ where, text: v });
        else if (k === "fa" && Array.isArray(v)) v.forEach((t, i) => out.push({ where: `${where}.fa[${i}]`, text: t }));
        else walk(v, `${where}.${k}`);
      }
    }
  };
  walk(eras, "eras");
  walk(worldCivilizations, "world");
  walk(pages, "pages");
  walk(mountains, "mountains");
  // The language switch speaks the other language on purpose.
  const english = new Set(["switchLanguage", "switchLanguageLabel"]);
  for (const [k, v] of Object.entries(getDictionary("fa"))) if (!english.has(k)) out.push({ where: `i18n.${k}`, text: v });
  return out;
}

describe("Persian texts", () => {
  const texts = persianTexts();
  // Names that stay in Latin script on purpose ({n} placeholders are filled in at runtime).
  const latinAllowed = /Natural Earth|WebGL/g;

  it("use Persian letters, digits and punctuation", () => {
    for (const { where, text } of texts) {
      expect(text, `${where}: Arabic yeh/kaf`).not.toMatch(/[يك]/);
      expect(text, `${where}: ASCII digits`).not.toMatch(/[0-9]/);
      expect(text.replace(latinAllowed, "").replace(/\{\w+\}/g, ""), `${where}: Latin letters`).not.toMatch(/[A-Za-z]/);
      expect(text, `${where}: ASCII , ; ?`).not.toMatch(/[,;?]/);
      expect(text, `${where}: double space`).not.toMatch(/ {2}/);
    }
  });

  it("give dates in the Gregorian calendar only", () => {
    const solarMonths = "فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند";
    const solarDate = new RegExp(`[۰-۹]+\\s*(${solarMonths})(?![\\u0600-\\u06FF])|(?<![\\u0600-\\u06FF])(${solarMonths})\\s+[۰-۹]{4}`);
    for (const { where, text } of texts) expect(text, where).not.toMatch(solarDate);
  });
});

describe("capitals", () => {
  // Capitals that lie outside the territory shown for the era, with the reason.
  const eraExceptions: Record<string, string> = {
    "ilkhanate/Samarkand": "Timur's capital; the era's territory shows the Ilkhanate at its height",
  };

  it("lie inside their era's territory", () => {
    for (const era of eras) {
      for (const c of era.capitals) {
        const key = `${era.id}/${c.name.en}`;
        if (eraExceptions[key]) continue;
        expect(containsPoint(era.territory, c.at), key).toBe(true);
      }
    }
  });

  it("of other civilizations lie inside their territory or one of its border stages", () => {
    for (const c of worldCivilizations) {
      const all = [c.territory, ...(c.stages ?? []).map((s) => s.territory)];
      expect(all.some((rings) => containsPoint(rings, c.capital.at)), `${c.id}: ${c.capital.name.en}`).toBe(true);
    }
  });
});
