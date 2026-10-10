import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { checkpoints, getCheckpoint } from "@/lib/content";
import { formatYearRange } from "@/lib/dates";
import { getDictionary, isLocale, locales } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => checkpoints.map((c) => ({ locale, checkpoint: c.id })));
}

type Props = { params: Promise<{ locale: string; checkpoint: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, checkpoint: id } = await params;
  const checkpoint = getCheckpoint(id);
  if (!isLocale(locale) || !checkpoint) return {};
  return { title: checkpoint.title[locale], description: checkpoint.summary[locale] };
}

export default async function CheckpointPage({ params }: Props) {
  const { locale, checkpoint: id } = await params;
  const checkpoint = getCheckpoint(id);
  if (!isLocale(locale) || !checkpoint) notFound();
  const t = getDictionary(locale);

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5" data-checkpoint={checkpoint.id}>
      <p className="text-sm font-medium tracking-wide text-turquoise">
        {formatYearRange(checkpoint.start, checkpoint.end, locale)}
      </p>
      <h1 className="text-3xl font-bold leading-snug sm:text-4xl">{checkpoint.title[locale]}</h1>
      <p className="text-lg leading-loose">{checkpoint.summary[locale]}</p>
      <aside className="flex items-start gap-3 rounded-2xl border border-line bg-surface/70 p-4">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-gold font-bold text-night"
        >
          {t.ravi.charAt(0)}
        </span>
        <div>
          <p className="font-bold text-gold">{t.ravi}</p>
          <p className="text-muted">{t.raviComingSoon}</p>
        </div>
      </aside>
    </article>
  );
}
