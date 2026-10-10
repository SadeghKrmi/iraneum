import Link from "next/link";
import { eras } from "@/lib/content";
import { getDictionary } from "@/lib/i18n";
import { resolveLocale, type LocaleParams } from "@/lib/pageParams";
import { eraHref } from "@/lib/routes";

export default async function LandingPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const t = getDictionary(locale);

  return (
    <main className="pointer-events-none fixed inset-x-0 bottom-[var(--dock-h)] top-20 z-10 grid place-items-center px-4">
      <section className="pointer-events-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-gold/30 bg-surface/80 p-8 text-center shadow-xl backdrop-blur-md">
        <p lang="fa" className="text-5xl font-bold text-gold sm:text-6xl">
          ایرانیوم
        </p>
        <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{t.welcomeTitle}</h1>
        <p className="text-lg leading-loose text-muted">{t.welcomeBody}</p>
        <Link
          href={eraHref(locale, eras[0].id)}
          className="mt-2 rounded-full bg-gold px-6 py-3 font-bold text-bg shadow transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {t.openStory}
        </Link>
      </section>
    </main>
  );
}
