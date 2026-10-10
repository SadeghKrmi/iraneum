import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";
import { eraHref } from "@/lib/routes";
import { eras } from "@/lib/content";
import { formatYearRange } from "@/lib/dates";
import { getDictionary } from "@/lib/i18n";
import { localeStaticParams, resolveLocale, type LocaleParams } from "@/lib/pageParams";

export const generateStaticParams = localeStaticParams;

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(props)).allEras };
}

export default async function ErasPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = getDictionary(locale);
  const count = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");

  return (
    <ProsePage title={t.allEras}>
      <ol className="flex flex-col gap-3">
        {eras.map((era) => (
          <li key={era.id}>
            <Link
              href={eraHref(locale, era.id)}
              className="block rounded-2xl border border-line bg-surface/70 p-4 transition-colors hover:border-gold focus-visible:outline-2 focus-visible:outline-gold"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-xl font-bold">{era.title[locale]}</span>
                <span className="text-sm text-turquoise">{formatYearRange(era.start, era.end, locale)}</span>
              </span>
              <span className="mt-1 block text-base leading-relaxed text-muted">{era.summary[locale]}</span>
              {era.events.length > 0 && (
                <span className="mt-2 block text-sm text-gold">
                  {count.format(era.events.length)} {t.events} · {t.openStory}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </ProsePage>
  );
}
