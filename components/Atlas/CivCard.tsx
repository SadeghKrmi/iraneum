"use client";

import { formatYearRange } from "@/lib/dates";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { WorldCivilization } from "@/lib/world";
import { CloseIcon } from "../icons";

/**
 * The civilization picked on the map, on screens too small for the "Meanwhile" panel:
 * a small card under the header with its name, years and summary.
 */
export function CivCard({
  locale,
  t,
  civilization: c,
  onClose,
}: {
  locale: Locale;
  t: Dictionary;
  civilization: WorldCivilization;
  onClose: () => void;
}) {
  return (
    <section
      aria-label={c.name[locale]}
      data-civ-card={c.id}
      className="animate-fade-in fixed inset-x-4 top-20 z-20 rounded-2xl border border-line bg-surface/90 p-3 shadow-lg backdrop-blur-md lg:hidden"
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
            {c.name[locale]}
          </h2>
          <p className="ps-4.5 font-num text-[0.7rem] text-muted">{formatYearRange(c.from, c.to, locale)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.closeCivilization}
          title={t.closeCivilization}
          className="-me-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-gold/10 hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
        >
          <CloseIcon className="size-4" />
        </button>
      </header>
      <p className="mt-1 ps-4.5 text-xs leading-relaxed text-muted">{c.summary[locale]}</p>
    </section>
  );
}
