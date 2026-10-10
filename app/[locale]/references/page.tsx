import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/ProsePage";
import { eraHref } from "@/lib/routes";
import { eras, generalReferences, type Reference } from "@/lib/content";
import { getDictionary } from "@/lib/i18n";
import { localeStaticParams, resolveLocale, type LocaleParams } from "@/lib/pageParams";

export const generateStaticParams = localeStaticParams;

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return { title: getDictionary(await resolveLocale(props)).references };
}

export default async function ReferencesPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = getDictionary(locale);

  return (
    <ProsePage title={t.references}>
      <section>
        <h2 className="mb-2 text-xl font-bold">{t.generalReferences}</h2>
        <ReferenceList items={generalReferences} />
      </section>
      {eras.map((era) => (
        <section key={era.id}>
          <h2 className="mb-2 text-xl font-bold">
            <Link href={eraHref(locale, era.id)} className="hover:text-gold">
              {era.title[locale]}
            </Link>
          </h2>
          {era.references.length ? (
            <ReferenceList items={era.references} />
          ) : (
            <p className="text-base text-muted">{t.noReferencesYet}</p>
          )}
        </section>
      ))}
    </ProsePage>
  );
}

/** Sources keep their original language and direction. */
function ReferenceList({ items }: { items: Reference[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 ps-6 text-base leading-relaxed">
      {items.map((ref) => (
        <li key={ref.title}>
          <bdi>
            {ref.author && <>{ref.author}, </>}
            {ref.url ? (
              <a href={ref.url} className="text-turquoise underline underline-offset-4 hover:text-gold">
                <cite>{ref.title}</cite>
              </a>
            ) : (
              <cite>{ref.title}</cite>
            )}
            {ref.publisher && <>, {ref.publisher}</>}
            {ref.year && <>, {ref.year}</>}
          </bdi>
        </li>
      ))}
    </ul>
  );
}
