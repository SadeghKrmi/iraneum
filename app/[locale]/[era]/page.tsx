import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryPlayer, type PlayerScene } from "@/components/Story/StoryPlayer";
import { findAudio } from "@/lib/audio";
import { eras, getEra, INTRO_SCENE_ID, scenesOf } from "@/lib/content";
import { formatYear, formatYearRange } from "@/lib/dates";
import { getDictionary, isLocale, locales } from "@/lib/i18n";

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

export default async function EraPage({ params }: Props) {
  const { locale, era: id } = await params;
  const era = getEra(id);
  if (!isLocale(locale) || !era) notFound();
  const t = getDictionary(locale);
  const position = eras.indexOf(era);
  const eraYears = formatYearRange(era.start, era.end, locale);

  const scenes: PlayerScene[] = scenesOf(era).map((scene) => {
    const intro = scene.id === INTRO_SCENE_ID;
    return {
      id: scene.id,
      yearLabel: intro ? eraYears : formatYear(scene.year, locale, scene.circa),
      title: scene.title[locale],
      text: scene.text[locale],
      audioSrc: findAudio(locale, era.id, scene.id),
    };
  });

  return (
    <StoryPlayer
      key={era.id}
      locale={locale}
      eraTitle={era.title[locale]}
      eraYears={eraYears}
      scenes={scenes}
      prevEraId={eras[position - 1]?.id ?? null}
      nextEraId={eras[position + 1]?.id ?? null}
      labels={{
        play: t.play,
        pause: t.pause,
        previous: t.previousScene,
        next: t.nextScene,
      }}
    />
  );
}
