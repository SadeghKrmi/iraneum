import type { Locale } from "./i18n";

const eraLabels: Record<Locale, { bce: string; ce: string }> = {
  fa: { bce: "پیش از میلاد", ce: "میلادی" },
  en: { bce: "BCE", ce: "CE" },
};

const numberFormats: Record<Locale, Intl.NumberFormat> = {
  fa: new Intl.NumberFormat("fa-IR", { useGrouping: false }),
  en: new Intl.NumberFormat("en-US", { useGrouping: false }),
};

/** Formats an astronomical-style year (negative = BCE) for display, e.g. -550 → "550 BCE" / "۵۵۰ پیش از میلاد". */
export function formatYear(year: number, locale: Locale): string {
  if (!Number.isInteger(year) || year === 0) {
    throw new Error(`Invalid year: ${year} (use negative integers for BCE; there is no year 0)`);
  }
  const era = eraLabels[locale];
  return `${numberFormats[locale].format(Math.abs(year))} ${year < 0 ? era.bce : era.ce}`;
}

/** Formats a span of years; the era label is written once when both ends share it. */
export function formatYearRange(start: number, end: number, locale: Locale): string {
  if ((start < 0) === (end < 0)) {
    const era = eraLabels[locale];
    const fmt = numberFormats[locale];
    return `${fmt.format(Math.abs(start))}–${fmt.format(Math.abs(end))} ${start < 0 ? era.bce : era.ce}`;
  }
  return `${formatYear(start, locale)} – ${formatYear(end, locale)}`;
}
