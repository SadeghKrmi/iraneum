import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../globals.css";
import { HydrationMarker } from "@/components/HydrationMarker";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Menu } from "@/components/Menu/Menu";
import { ThemeToggle, themeInitScript } from "@/components/ThemeToggle";
import { Timeline } from "@/components/Timeline/Timeline";
import { eras } from "@/lib/content";
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

  return (
    // data-theme is set by themeInitScript before paint, so it legitimately differs from the server HTML.
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        {/* First thing in <body>: runs before anything is painted. (In <head> it trips React hydration.) */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
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
        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">{children}</main>
        <Timeline locale={locale} eras={eras} labels={{ timeline: t.timeline, previous: t.previous, next: t.next }} />
        <HydrationMarker />
      </body>
    </html>
  );
}
