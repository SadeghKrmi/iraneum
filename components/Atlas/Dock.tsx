"use client";

import type { Dictionary } from "@/lib/i18n";
import { ChevronBackIcon, ChevronForwardIcon, GlobeIcon, PauseIcon, PlayIcon } from "../icons";

type Props = {
  t: Dictionary;
  year: string | null;
  eraName: string | null;
  playing: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onStep: (delta: 1 | -1) => void;
  onTogglePlay: () => void;
  /** "Compare with the world" switch (on era pages). */
  compare: { on: boolean; toggle: () => void } | null;
  children: React.ReactNode;
};

/** Bottom dock: playback controls, the current year and era, and the timeline. */
export function Dock({
  t,
  year,
  eraName,
  playing,
  canGoBack,
  canGoForward,
  onStep,
  onTogglePlay,
  compare,
  children,
}: Props) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-20 flex h-[var(--dock-h)] flex-col justify-end bg-gradient-to-t from-bg from-55% to-transparent pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center gap-2 px-3 sm:px-5">
        <RoundButton label={t.previousScene} disabled={!canGoBack} onClick={() => onStep(-1)}>
          <ChevronBackIcon />
        </RoundButton>
        <button
          type="button"
          onClick={onTogglePlay}
          aria-pressed={playing}
          aria-label={playing ? t.pause : t.play}
          title={playing ? t.pause : t.play}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-gold text-bg shadow transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <RoundButton label={t.nextScene} disabled={!canGoForward} onClick={() => onStep(1)}>
          <ChevronForwardIcon />
        </RoundButton>
        {year && (
          <p className="ms-1 min-w-0 truncate whitespace-nowrap font-num text-lg sm:ms-2 sm:text-2xl" data-year>
            {year}
          </p>
        )}
        {eraName && (
          <p className="ms-3 hidden truncate text-sm uppercase ltr:tracking-[0.15em] text-muted md:block">{eraName}</p>
        )}
        {compare && (
          <button
            type="button"
            onClick={compare.toggle}
            aria-pressed={compare.on}
            aria-label={t.compare}
            title={t.compare}
            className={`ms-auto flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-gold ${
              compare.on ? "border-gold bg-gold/15 text-gold" : "border-line bg-bg/60 text-muted hover:border-gold hover:text-gold"
            }`}
          >
            <GlobeIcon className="size-5" />
            <span className="hidden sm:inline">{t.compare}</span>
          </button>
        )}
      </div>
      {children}
    </footer>
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
      className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-bg/60 transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-30 disabled:hover:border-line disabled:hover:text-fg"
    >
      {children}
    </button>
  );
}
