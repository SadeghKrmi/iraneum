import type { Locale } from "./i18n";

export function eraHref(locale: Locale, id: string) {
  return `/${locale}/${id}/`;
}
