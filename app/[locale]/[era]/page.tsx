import type { Metadata } from "next";
import { eras, getEra } from "@/lib/content";
import { isLocale, locales } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => eras.map((e) => ({ locale, era: e.id })));
}

type Props = { params: Promise<{ locale: string; era: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, era: id } = await params;
  const era = getEra(id);
  if (!isLocale(locale) || !era) return {};
  return { title: era.title[locale], description: era.summary[locale] };
}

/** The era's map, card and story are drawn by AtlasApp in the layout, from this route's era id. */
export default function EraPage() {
  return null;
}
