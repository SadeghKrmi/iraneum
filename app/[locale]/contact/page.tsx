import type { Metadata } from "next";
import { ProsePage } from "@/components/ProsePage";
import { pages } from "@/lib/content";
import { localeStaticParams, resolveLocale, type LocaleParams } from "@/lib/pageParams";

export const generateStaticParams = localeStaticParams;

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return { title: pages.contact.title[await resolveLocale(props)] };
}

export default async function ContactPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  return (
    <ProsePage title={pages.contact.title[locale]}>
      {pages.contact.body[locale].map((p) => (
        <p key={p}>{p}</p>
      ))}
      <p>
        <a
          href={pages.contact.link}
          dir="ltr"
          className="break-all text-turquoise underline underline-offset-4 hover:text-gold"
        >
          {pages.contact.link.replace("https://", "")}
        </a>
      </p>
    </ProsePage>
  );
}
