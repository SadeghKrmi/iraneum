import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SwipeArea } from "@/components/SwipeArea";
import { Timeline } from "@/components/Timeline/Timeline";
import { checkpoints } from "@/lib/content";
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

  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div>
            <p className="text-xl font-bold text-gold">{t.siteTitle}</p>
            <p className="text-sm text-muted">{t.tagline}</p>
          </div>
          <LanguageSwitcher locale={locale} label={t.switchLanguage} ariaLabel={t.switchLanguageLabel} />
        </header>
        <SwipeArea locale={locale} checkpointIds={checkpoints.map((c) => c.id)}>
          {children}
        </SwipeArea>
        <Timeline
          locale={locale}
          checkpoints={checkpoints}
          labels={{ timeline: t.timeline, previous: t.previous, next: t.next }}
        />
      </body>
    </html>
  );
}
