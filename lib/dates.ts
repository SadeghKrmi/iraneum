import type { Locale } from "./i18n";

const eraLabels: Record<Locale, { bce: string; ce: string; circa: string; today: string }> = {
  fa: { bce: "پیش از میلاد", ce: "میلادی", circa: "حدود", today: "تاکنون" },
  en: { bce: "BCE", ce: "CE", circa: "c.", today: "today" },
};

const numberFormats: Record<Locale, Intl.NumberFormat> = {
  fa: new Intl.NumberFormat("fa-IR", { useGrouping: false }),
  en: new Intl.NumberFormat("en-US", { useGrouping: false }),
};

/** Formats an astronomical-style year (negative = BCE) for display, e.g. -550 → "550 BCE" / "۵۵۰ پیش از میلاد". */
export function formatYear(year: number, locale: Locale, circa = false): string {
  if (!Number.isInteger(year) || year === 0) {
    throw new Error(`Invalid year: ${year} (use negative integers for BCE; there is no year 0)`);
  }
  const era = eraLabels[locale];
  const text = `${numberFormats[locale].format(Math.abs(year))} ${year < 0 ? era.bce : era.ce}`;
  return circa ? `${era.circa} ${text}` : text;
}

const shortEraLabels: Record<Locale, { bce: string; ce: string }> = {
  fa: { bce: "پ.م.", ce: "م." },
  en: { bce: "BCE", ce: "CE" },
};

/** A compact year for tight labels (no "circa"), e.g. -53 → "53 BCE" / "۵۳ پ.م.". */
export function formatYearShort(year: number, locale: Locale): string {
  formatYear(year, locale); // validates the year
  const era = shortEraLabels[locale];
  return `${numberFormats[locale].format(Math.abs(year))} ${year < 0 ? era.bce : era.ce}`;
}

/**
 * Formats a span of years; the era label is written once when both ends share it.
 * Without an end (an era that continues today) it reads "1979 CE – today".
 */
export function formatYearRange(start: number, end: number | undefined, locale: Locale): string {
  if (end === undefined) return `${formatYear(start, locale)} – ${eraLabels[locale].today}`;
  if ((start < 0) === (end < 0)) {
    const era = eraLabels[locale];
    const fmt = numberFormats[locale];
    return `${fmt.format(Math.abs(start))}–${fmt.format(Math.abs(end))} ${start < 0 ? era.bce : era.ce}`;
  }
  return `${formatYear(start, locale)} – ${formatYear(end, locale)}`;
}

/** A plain number in the locale's digits, e.g. 2 → "۲" in Persian. */
export function formatNumber(n: number, locale: Locale): string {
  return numberFormats[locale].format(n);
}
