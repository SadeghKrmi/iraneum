import type { Metadata } from "next";
import { ProsePage } from "@/components/ProsePage";
import { pages } from "@/lib/content";
import { localeStaticParams, resolveLocale, type LocaleParams } from "@/lib/pageParams";

export const generateStaticParams = localeStaticParams;

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return { title: pages.about.title[await resolveLocale(props)] };
}

export default async function AboutPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  return (
    <ProsePage title={pages.about.title[locale]}>
      {pages.about.body[locale].map((p) => (
        <p key={p}>{p}</p>
      ))}
    </ProsePage>
  );
}
