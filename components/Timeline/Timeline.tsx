"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Era } from "@/lib/content";
import { formatYear } from "@/lib/dates";
import { dirOf, type Locale } from "@/lib/i18n";
import { ChevronBackIcon, ChevronForwardIcon } from "../icons";
import { eraHref } from "@/lib/routes";
import { useEraNav } from "../useEraNav";

type Props = {
  locale: Locale;
  eras: readonly Era[];
  labels: { timeline: string; previous: string; next: string };
};

/**
 * Bottom timeline bar. Eras are evenly spaced in chronological order;
 * in Persian (RTL) time flows right-to-left, matching the reading direction.
 */
export function Timeline({ locale, eras, labels }: Props) {
  const ids = eras.map((e) => e.id);
  const { selectedId, index, go, goTo } = useEraNav(locale, ids);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => {
    if (!selectedId) return;
    linkRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [selectedId]);

  const focus = (id: string | null) => id && linkRefs.current.get(id)?.focus();

  const onKeyDown = (e: React.KeyboardEvent) => {
    const rtl = dirOf(locale) === "rtl";
    const forwardKey = rtl ? "ArrowLeft" : "ArrowRight";
    const backKey = rtl ? "ArrowRight" : "ArrowLeft";
    let id: string | null = null;
    if (e.key === forwardKey) id = go(1);
    else if (e.key === backKey) id = go(-1);
    else if (e.key === "Home") id = goTo(0);
    else if (e.key === "End") id = goTo(ids.length - 1);
    else return;
    e.preventDefault();
    focus(id);
  };

  return (
    <nav
      aria-label={labels.timeline}
      className="sticky bottom-0 z-10 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="flex items-center gap-1 px-2 sm:px-4">
        <StepButton label={labels.previous} disabled={index <= 0} onClick={() => go(-1)} flip={false} />
        <div className="min-w-0 flex-1 overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)] [scrollbar-width:none]">
          <ol className="relative flex w-max min-w-full py-3" onKeyDown={onKeyDown}>
            <li aria-hidden className="pointer-events-none absolute inset-x-6 top-[1.375rem] h-px bg-line" />
            {eras.map((c) => {
              const selected = c.id === selectedId;
              return (
                <li key={c.id} className="flex min-w-36 flex-1 basis-0 justify-center">
                  <Link
                    ref={(el) => {
                      if (el) linkRefs.current.set(c.id, el);
                      else linkRefs.current.delete(c.id);
                    }}
                    href={eraHref(locale, c.id)}
                    aria-current={selected ? "step" : undefined}
                    data-era={c.id}
                    className="group flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-center focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    <span className="flex h-5 items-center">
                      <span
                        className={
                          selected
                            ? "size-5 rounded-full bg-gold ring-4 ring-gold/30"
                            : "size-3.5 rounded-full border-2 border-turquoise bg-bg transition-transform group-hover:scale-125"
                        }
                      />
                    </span>
                    <span
                      className={`whitespace-nowrap text-sm font-medium ${selected ? "text-gold" : "text-fg group-hover:text-gold"}`}
                    >
                      {c.title[locale]}
                    </span>
                    <span className="whitespace-nowrap text-xs text-muted">{formatYear(c.start, locale)}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
        <StepButton label={labels.next} disabled={index >= ids.length - 1} onClick={() => go(1)} flip />
      </div>
    </nav>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  flip,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  /** Point toward the end of the line (next) instead of the start (previous). */
  flip: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-10 shrink-0 place-items-center rounded-full text-fg transition-colors hover:bg-surface hover:text-gold focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-fg"
    >
      {flip ? <ChevronForwardIcon /> : <ChevronBackIcon />}
    </button>
  );
}
