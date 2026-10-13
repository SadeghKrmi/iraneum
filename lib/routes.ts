import { withBase } from "./basePath";
import type { Locale } from "./i18n";

export function eraHref(locale: Locale, id: string) {
  return `/${locale}/${id}/`;
}

/** The site icon (public/icon.svg, with public/favicon.ico for browsers that ask for it). */
export const siteIcons = {
  icon: [
    { url: withBase("/icon.svg"), type: "image/svg+xml" },
    { url: withBase("/favicon.ico"), sizes: "16x16 32x32 48x48" },
  ],
};
