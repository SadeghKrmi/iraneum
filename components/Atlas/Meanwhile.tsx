"use client";

import { useEffect, useRef } from "react";
import { formatYearRange } from "@/lib/dates";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { WorldCivilization } from "@/lib/world";
import { ChevronUpIcon, GlobeIcon } from "../icons";

type Props = {
  locale: Locale;
  t: Dictionary;
  /** The year being compared, already formatted. */
  year: string;
  civilizations: WorldCivilization[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  open: boolean;
  onToggle: (open: boolean) => void;
};

/** "Meanwhile in the world": the other civilizations that existed in the current scene's year. */
export function Meanwhile({ locale, t, year, civilizations, selectedId, onSelect, open, onToggle }: Props) {
  const list = useRef<HTMLUListElement>(null);
  // Bring the selected entry into view, e.g. after a civilization is clicked on the map.
  useEffect(() => {
    if (!open || !selectedId) return;
    list.current?.querySelector(`[data-civ="${CSS.escape(selectedId)}"]`)?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [open, selectedId]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onToggle(true)}
        aria-label={t.meanwhile}
        title={t.meanwhile}
        className="pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface/90 text-muted shadow-lg backdrop-blur-md transition-transform hover:scale-105 hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
      >
        <GlobeIcon />
      </button>
    );
  }
  return (
    <section
      aria-label={t.meanwhile}
      data-meanwhile
      className="pointer-events-auto flex min-h-0 w-full flex-col rounded-2xl border border-line bg-surface/85 shadow-lg backdrop-blur-md"
    >
      <header className="flex items-center justify-between gap-2 px-3 pt-3">
        <div>
          <p className="font-num text-xs uppercase text-muted ltr:tracking-widest">{t.meanwhile}</p>
          <p className="font-num text-sm text-turquoise">{year}</p>
          <p className="mt-1 text-[0.7rem] leading-snug text-muted">{t.pickHint}</p>
        </div>
        <button
          type="button"
          onClick={() => onToggle(false)}
          aria-label={t.hidePanel}
          title={t.hidePanel}
          className="-me-1 grid size-7 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-gold/10 hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
        >
          <ChevronUpIcon className="size-4" />
        </button>
      </header>
      <ul ref={list} className="scrollbar-modern mt-2 flex min-h-0 flex-col overflow-y-auto px-1.5 pb-2">
        {civilizations.map((c) => {
          const selected = c.id === selectedId;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-pressed={selected}
                title={t.showOnMap}
                data-civ={c.id}
                className={`flex w-full flex-col gap-0.5 rounded-xl px-2 py-1.5 text-start transition-colors hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-gold ${selected ? "bg-gold/15" : ""}`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                  {c.name[locale]}
                </span>
                <span className="ps-4.5 font-num text-[0.7rem] text-muted">{formatYearRange(c.from, c.to, locale)}</span>
                <span className="ps-4.5 text-xs leading-relaxed text-muted">{c.summary[locale]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
