"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useEffectEvent, useRef, useState } from "react";
import { dirOf, type Locale } from "@/lib/i18n";
import { ChevronBackIcon, ChevronForwardIcon, PauseIcon, PlayIcon } from "../icons";
import { Ravi } from "../Ravi/Ravi";
import { eraHref } from "@/lib/routes";
import { EventBar } from "./EventBar";

export type PlayerScene = {
  id: string;
  yearLabel: string;
  chipLabel: string;
  title: string;
  text: string;
  /** Narration audio; scenes without it are read at a comfortable pace instead. */
  audioSrc?: string;
};

export type StoryPlayerProps = {
  locale: Locale;
  eraTitle: string;
  eraYears: string;
  scenes: PlayerScene[];
  prevEraId: string | null;
  nextEraId: string | null;
  labels: { keyYears: string; play: string; pause: string; previous: string; next: string };
};

const MIN_SWIPE_PX = 60;

/** Time to read a scene that has no audio yet. */
function readingMs(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.min(20000, Math.max(4000, words * 380));
}

/**
 * Ravi tells an era scene by scene. The current scene is kept in the URL (?e=<scene id>).
 * The static HTML contains the first scene (the Suspense fallback), so the story is readable without JS.
 */
export function StoryPlayer(props: StoryPlayerProps) {
  return (
    <Suspense fallback={<StoryView {...props} index={0} playing={false} />}>
      <InteractiveStoryPlayer {...props} />
    </Suspense>
  );
}

function InteractiveStoryPlayer(props: StoryPlayerProps) {
  const { locale, scenes, prevEraId, nextEraId } = props;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const found = scenes.findIndex((s) => s.id === params.get("e"));
  const index = found === -1 ? 0 : found;
  // Arriving with ?play=1 means Ravi is continuing the story from the previous era.
  const [playing, setPlaying] = useState(params.get("play") === "1");
  const audio = useRef<HTMLAudioElement>(null);

  const showScene = (i: number) => {
    router.replace(i === 0 ? pathname : `${pathname}?e=${scenes[i].id}`, { scroll: false });
  };

  /** Moves one scene forward or back, crossing into the neighbouring era at either end. */
  const step = (delta: 1 | -1, keepPlaying = false) => {
    const target = index + delta;
    if (target >= 0 && target < scenes.length) return showScene(target);
    const eraId = delta > 0 ? nextEraId : prevEraId;
    if (!eraId) return setPlaying(false);
    router.push(eraHref(locale, eraId) + (keepPlaying ? "?play=1" : ""));
  };

  const advance = useEffectEvent(() => step(1, true));

  useEffect(() => {
    if (!playing) return;
    const scene = scenes[index];
    const el = audio.current;
    if (scene.audioSrc && el) {
      el.src = scene.audioSrc;
      el.onended = () => advance();
      el.play().catch(() => setPlaying(false));
      return () => {
        el.onended = null;
        el.pause();
      };
    }
    const timer = setTimeout(() => advance(), readingMs(scene.text));
    return () => clearTimeout(timer);
  }, [playing, index, scenes]);

  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swipe = {
    onPointerDown: (e: React.PointerEvent) => {
      swipeStart.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const start = swipeStart.current;
      swipeStart.current = null;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) < MIN_SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      // Swiping against the reading direction moves forward in time.
      const forward = dirOf(locale) === "rtl" ? dx > 0 : dx < 0;
      step(forward ? 1 : -1, playing);
    },
    onPointerCancel: () => {
      swipeStart.current = null;
    },
  };

  return (
    <>
      <StoryView
        {...props}
        index={index}
        playing={playing}
        onSelect={showScene}
        onStep={(d) => step(d, playing)}
        onTogglePlay={() => setPlaying((p) => !p)}
        swipeHandlers={swipe}
      />
      <audio ref={audio} preload="none" />
    </>
  );
}

type ViewProps = StoryPlayerProps & {
  index: number;
  playing: boolean;
  onSelect?: (index: number) => void;
  onStep?: (delta: 1 | -1) => void;
  onTogglePlay?: () => void;
  swipeHandlers?: React.HTMLAttributes<HTMLDivElement>;
};

function StoryView({
  eraTitle,
  eraYears,
  scenes,
  labels,
  index,
  playing,
  prevEraId,
  nextEraId,
  onSelect,
  onStep,
  onTogglePlay,
  swipeHandlers,
}: ViewProps) {
  const scene = scenes[index];
  const atStart = index === 0 && !prevEraId;
  const atEnd = index === scenes.length - 1 && !nextEraId;

  return (
    // data-interactive appears once the client player has replaced the pre-rendered first scene.
    <div className="flex w-full max-w-4xl flex-col gap-5" data-story data-interactive={onSelect ? "" : undefined}>
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{eraTitle}</h1>
        <p className="text-sm text-turquoise">{eraYears}</p>
      </header>

      <div className="flex touch-pan-y items-start gap-3 sm:gap-6" {...swipeHandlers}>
        <Ravi speaking={playing} className="w-20 shrink-0 sm:w-36" />
        <article
          key={scene.id}
          data-scene={scene.id}
          aria-live="polite"
          className="animate-fade-in relative min-h-48 flex-1 rounded-3xl border border-line bg-surface/80 p-5 shadow-sm sm:p-7"
        >
          <span
            aria-hidden
            className="absolute -start-2 top-8 size-4 rotate-45 border-b border-s border-line bg-surface"
          />
          <p className="text-sm font-medium text-turquoise">{scene.yearLabel}</p>
          <h2 className="mt-1 text-xl font-bold leading-snug text-gold sm:text-2xl">{scene.title}</h2>
          <p className="mt-3 text-base leading-loose sm:text-lg">{scene.text}</p>
        </article>
      </div>

      <div className="flex items-center justify-center gap-3">
        <RoundButton label={labels.previous} disabled={atStart} onClick={() => onStep?.(-1)}>
          <ChevronBackIcon />
        </RoundButton>
        <button
          type="button"
          onClick={onTogglePlay}
          aria-pressed={playing}
          className="flex h-12 items-center gap-2 rounded-full bg-gold px-6 font-bold text-bg shadow transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
          <span>{playing ? labels.pause : labels.play}</span>
        </button>
        <RoundButton label={labels.next} disabled={atEnd} onClick={() => onStep?.(1)}>
          <ChevronForwardIcon />
        </RoundButton>
      </div>

      {scenes.length > 1 && (
        <EventBar
          label={labels.keyYears}
          chips={scenes.map((s) => ({ id: s.id, label: s.chipLabel, title: s.title }))}
          current={index}
          onSelect={(i) => onSelect?.(i)}
        />
      )}
    </div>
  );
}

function RoundButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-30 disabled:hover:border-line disabled:hover:text-fg"
    >
      {children}
    </button>
  );
}
