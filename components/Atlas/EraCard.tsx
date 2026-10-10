"use client";

import { useRef, useState } from "react";
import type { Era, EventType, Scene } from "@/lib/content";
import { formatNumber, formatYear, formatYearRange } from "@/lib/dates";
import { dirOf, type Dictionary, type Locale } from "@/lib/i18n";
import { eventColors } from "../Map/palette";

type Props = {
  locale: Locale;
  era: Era;
  position: number;
  total: number;
  scenes: Scene[];
  index: number;
  playing: boolean;
  /** False in the pre-rendered HTML, before the browser has taken over. */
  interactive: boolean;
  t: Dictionary;
  onSelect: (index: number) => void;
  onStep: (delta: 1 | -1) => void;
};

const MIN_SWIPE_PX = 60;

/** The era's panel: names, dates, capitals, rulers, the current scene and the list of marked years. */
export function EraCard({ locale, era, position, total, scenes, index, playing, interactive, t, onSelect, onStep }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const scene = scenes[index];
  const other: Locale = locale === "fa" ? "en" : "fa";
  const eraYears = formatYearRange(era.start, era.end, locale);
  const typeLabel = (type: EventType) => t[`type_${type}`];

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
      onStep((dirOf(locale) === "rtl" ? dx > 0 : dx < 0) ? 1 : -1);
    },
    onPointerCancel: () => {
      swipeStart.current = null;
    },
  };

  return (
    <aside
      data-story
      data-interactive={interactive ? "" : undefined}
      data-playing={playing}
      className="fixed inset-x-3 bottom-[calc(var(--dock-h)+0.5rem)] z-10 flex max-h-[40dvh] flex-col rounded-2xl border border-gold/30 bg-surface/85 shadow-xl backdrop-blur-md sm:inset-x-auto sm:start-4 sm:top-24 sm:max-h-none sm:w-[min(24rem,calc(100vw-2rem))]"
    >
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4 sm:gap-4 sm:p-6">
        <header className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-num text-[0.7rem] uppercase ltr:tracking-widest text-muted">
              {t.eraOf.replace("{n}", formatNumber(position, locale)).replace("{total}", formatNumber(total, locale))}
            </p>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
              className="rounded-full px-2 text-xs text-muted hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
            >
              {collapsed ? t.showPanel : t.hidePanel}
            </button>
          </div>
          <h1 className="text-2xl font-bold leading-snug text-gold sm:text-3xl">{era.title[locale]}</h1>
          <p lang={other} className={`text-xs text-muted ${other === "en" ? "uppercase tracking-[0.2em]" : ""}`}>
            {era.title[other]}
          </p>
          <p className="font-num text-sm text-turquoise">{eraYears}</p>
        </header>

        {!collapsed && (
          <>
            <dl className="hidden grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm sm:grid">
              <dt className="pt-0.5 text-xs uppercase ltr:tracking-widest text-muted">{t.capital}</dt>
              <dd>{era.capitals.map((c) => c.name[locale]).join(locale === "fa" ? "، " : ", ")}</dd>
              <dt className="pt-0.5 text-xs uppercase ltr:tracking-widest text-muted">{t.rulers}</dt>
              <dd>{era.rulers[locale]}</dd>
            </dl>

            <article
              key={scene.id}
              data-scene={scene.id}
              aria-live="polite"
              className="animate-fade-in flex touch-pan-y flex-col gap-1.5 border-t border-gold/25 pt-3 sm:pt-4"
              {...swipe}
            >
              <p className="flex items-center gap-2">
                <span
                  className="rounded-full border px-2 py-0.5 font-num text-[0.7rem] uppercase ltr:tracking-widest"
                  style={{ color: scene.type ? eventColors[scene.type] : "var(--turquoise)" }}
                >
                  {scene.type ? typeLabel(scene.type) : t.overview}
                </span>
                <span className="font-num text-xs text-muted">
                  {scene.type ? formatYear(scene.year, locale, scene.circa) : eraYears}
                </span>
              </p>
              {scene.type && <h2 className="text-xl font-bold leading-snug">{scene.title[locale]}</h2>}
              <p className="text-[0.95rem] leading-relaxed sm:text-base sm:leading-loose">{scene.text[locale]}</p>
            </article>

            {scenes.length > 1 && (
              <ol className="hidden flex-col border-t border-line sm:flex">
                {scenes.map((s, i) => {
                  const current = i === index;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(i)}
                        aria-current={current ? "step" : undefined}
                        data-scene-item={s.id}
                        className={`grid w-full grid-cols-[6.5rem_0.75rem_1fr] rtl:grid-cols-[9.5rem_0.75rem_1fr] items-center gap-2 border-b border-line/60 px-1 py-1.5 text-start text-sm transition-colors hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold ${current ? "bg-gold/15 text-fg" : "text-muted"}`}
                      >
                        <span className={`font-num text-xs ${current ? "text-gold" : ""}`}>
                          {s.type ? formatYear(s.year, locale, s.circa) : formatYear(era.start, locale)}
                        </span>
                        <span
                          aria-hidden
                          className={`size-2 ${s.type === "monument" ? "rotate-45" : "rounded-full"}`}
                          style={{ background: s.type ? eventColors[s.type] : "var(--turquoise)" }}
                        />
                        <span className="truncate">{s.type ? s.title[locale] : t.overview}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
