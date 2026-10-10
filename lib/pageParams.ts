import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "./i18n";

export type LocaleParams = { params: Promise<{ locale: string }> };

export function localeStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Resolves the `[locale]` route param, or renders the 404 page. */
export async function resolveLocale({ params }: LocaleParams): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
