import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../globals.css";
import { AtlasApp } from "@/components/Atlas/AtlasApp";
import { HydrationMarker } from "@/components/HydrationMarker";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Menu } from "@/components/Menu/Menu";
import { ThemeToggle, themeInitScript } from "@/components/ThemeToggle";
import { findAudio } from "@/lib/audio";
import { eras, scenesOf } from "@/lib/content";
import { dirOf, getDictionary, isLocale, locales } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: { default: `${t.siteTitle} — ${t.tagline}`, template: `%s | ${t.siteTitle}` },
    description: t.welcomeBody,
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const page = (slug: string) => `/${locale}/${slug}/`;
  // Narration files present at build time, so the player knows which scenes have audio.
  const audio: Record<string, string> = {};
  for (const era of eras) {
    for (const scene of scenesOf(era)) {
      const src = findAudio(locale, era.id, scene.id);
      if (src) audio[`${era.id}/${scene.id}`] = src;
    }
  }

  return (
    // data-theme is set by themeInitScript before paint, so it legitimately differs from the server HTML.
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <body className="h-dvh overflow-hidden font-sans antialiased">
        {/* First thing in <body>: runs before anything is painted. (In <head> it trips React hydration.) */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <AtlasApp locale={locale} eras={eras} audio={audio} t={t} />
        <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between gap-3 bg-gradient-to-b from-bg/90 to-transparent px-4 pb-8 pt-4 sm:px-6 [&>*]:pointer-events-auto">
          <Link href={`/${locale}/`} className="min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-gold">
            <p className="text-xl font-bold text-gold">{t.siteTitle}</p>
            <p className="truncate text-sm text-muted">{t.tagline}</p>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher locale={locale} label={t.switchLanguage} ariaLabel={t.switchLanguageLabel} />
            <ThemeToggle label={t.toggleTheme} />
            <Menu
              labels={{ open: t.openMenu, close: t.closeMenu, title: t.menu }}
              links={[
                { href: `/${locale}/`, label: t.home },
                { href: page("eras"), label: t.allEras },
                { href: page("about"), label: t.about },
                { href: page("references"), label: t.references },
                { href: page("contact"), label: t.contact },
              ]}
            />
          </div>
        </header>
        {children}
        <HydrationMarker />
      </body>
    </html>
  );
}
