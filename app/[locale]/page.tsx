import { getDictionary, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
      <h1 className="text-3xl font-bold leading-snug sm:text-4xl">{t.welcomeTitle}</h1>
      <p className="text-lg leading-loose text-muted">{t.welcomeBody}</p>
    </section>
  );
}
