"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useEffectEvent, useRef, useState } from "react";
import { scenesOf, type Era } from "@/lib/content";
import { formatYear } from "@/lib/dates";
import type { Dictionary, Locale } from "@/lib/i18n";
import { eraHref } from "@/lib/routes";
import { MapStage } from "../Map/MapStage";
import { Timeline } from "../Timeline/Timeline";
import { Dock } from "./Dock";
import { EraCard } from "./EraCard";
import { MapKey } from "./MapKey";

export type AtlasAppProps = {
  locale: Locale;
  eras: readonly Era[];
  /** Narration files that exist, keyed "<era id>/<scene id>". */
  audio: Record<string, string>;
  t: Dictionary;
};

/**
 * Everything around the page content: the 3D map, the era card, the dock with playback controls and the
 * timeline. It lives in the layout, so playback continues when the story moves on to the next era.
 * The current era comes from the route, the current scene from ?e=<scene id>.
 */
export function AtlasApp(props: AtlasAppProps) {
  // ?e= is only known in the browser; the pre-rendered page shows each era's overview.
  return (
    <Suspense fallback={<Atlas {...props} sceneId={null} interactive={false} />}>
      <AtlasWithScene {...props} />
    </Suspense>
  );
}

function AtlasWithScene(props: AtlasAppProps) {
  return <Atlas {...props} sceneId={useSearchParams().get("e")} interactive />;
}

/** Time to read a scene that has no audio yet. */
function readingMs(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.min(20000, Math.max(4000, words * 380));
}

function Atlas({
  locale,
  eras,
  audio,
  t,
  sceneId,
  interactive,
}: AtlasAppProps & { sceneId: string | null; interactive: boolean }) {
  const router = useRouter();
  const params = useParams<{ era?: string }>();
  const eraIndex = eras.findIndex((e) => e.id === params.era);
  const era = eraIndex === -1 ? null : eras[eraIndex];
  const scenes = era ? scenesOf(era) : [];
  const found = scenes.findIndex((s) => s.id === sceneId);
  const index = found === -1 ? 0 : found;
  const scene = scenes[index] ?? null;

  const [playing, setPlaying] = useState(false);
  const audioEl = useRef<HTMLAudioElement>(null);

  const showScene = (i: number) => {
    if (!era) return;
    router.replace(i === 0 ? eraHref(locale, era.id) : `${eraHref(locale, era.id)}?e=${scenes[i].id}`, {
      scroll: false,
    });
  };

  /** Moves one scene forward or back, crossing into the neighbouring era at either end. */
  const step = (delta: 1 | -1) => {
    if (!era) {
      if (delta > 0) router.push(eraHref(locale, eras[0].id));
      return;
    }
    const target = index + delta;
    if (target >= 0 && target < scenes.length) return showScene(target);
    const next = eras[eraIndex + delta];
    if (!next) return setPlaying(false);
    router.push(eraHref(locale, next.id));
  };

  const togglePlay = () => {
    if (!era) router.push(eraHref(locale, eras[0].id));
    setPlaying((p) => !p);
  };

  const advance = useEffectEvent(() => step(1));
  const audioSrc = era && scene ? audio[`${era.id}/${scene.id}`] : undefined;

  useEffect(() => {
    if (!playing || !scene) return;
    const el = audioEl.current;
    if (audioSrc && el) {
      el.src = audioSrc;
      el.onended = () => advance();
      el.play().catch(() => setPlaying(false));
      return () => {
        el.onended = null;
        el.pause();
      };
    }
    const timer = setTimeout(() => advance(), readingMs(scene.text[locale]));
    return () => clearTimeout(timer);
  }, [playing, scene, audioSrc, locale]);

  // Space plays/pauses, unless a control has focus (then Space activates that control).
  const onSpace = useEffectEvent((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (e.code !== "Space" || target?.closest("a, button, input, textarea, select, [contenteditable]")) return;
    e.preventDefault();
    togglePlay();
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onSpace(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const year = scene ? formatYear(scene.year, locale, scene.circa) : null;

  return (
    <>
      <MapStage locale={locale} era={era} scene={scene} noWebglText={t.noWebgl} />
      {era && scene && (
        <EraCard
          locale={locale}
          era={era}
          position={eraIndex + 1}
          total={eras.length}
          scenes={scenes}
          index={index}
          playing={playing}
          interactive={interactive}
          t={t}
          onSelect={showScene}
          onStep={step}
        />
      )}
      {era && <MapKey t={t} />}
      <Dock
        t={t}
        year={year}
        eraName={era?.title[locale] ?? null}
        playing={playing}
        canGoBack={!!era && (index > 0 || eraIndex > 0)}
        canGoForward={!era || index < scenes.length - 1 || eraIndex < eras.length - 1}
        onStep={step}
        onTogglePlay={togglePlay}
      >
        <Timeline
          locale={locale}
          eras={eras}
          currentEventId={sceneId}
          labels={{ timeline: t.timeline, previous: t.previous, next: t.next }}
        />
      </Dock>
      <audio ref={audioEl} preload="none" />
    </>
  );
}
