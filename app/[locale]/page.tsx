import Link from "next/link";
import { eraHref } from "@/lib/routes";
import { eras } from "@/lib/content";
import { getDictionary } from "@/lib/i18n";
import { resolveLocale, type LocaleParams } from "@/lib/pageParams";

export default async function LandingPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = getDictionary(locale);

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
      <h1 className="text-3xl font-bold leading-snug sm:text-4xl">{t.welcomeTitle}</h1>
      <p className="text-lg leading-loose text-muted">{t.welcomeBody}</p>
      <Link
        href={eraHref(locale, eras[0].id)}
        className="mt-2 rounded-full bg-gold px-6 py-3 font-bold text-bg shadow transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {t.openStory}
      </Link>
    </section>
  );
}
