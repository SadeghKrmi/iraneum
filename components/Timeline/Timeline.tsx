"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import type { Era } from "@/lib/content";
import { formatYear } from "@/lib/dates";
import { dirOf, type Locale } from "@/lib/i18n";
import { eraHref } from "@/lib/routes";
import { ChevronBackIcon, ChevronForwardIcon } from "../icons";
import { useEraNav } from "../useEraNav";

type Props = {
  locale: Locale;
  eras: readonly Era[];
  labels: { timeline: string; previous: string; next: string };
};

/**
 * Bottom timeline bar. Each era is a segment: its checkpoint, then small points for its marked years,
 * up to the next era's checkpoint. In Persian (RTL) time flows right-to-left, matching the reading direction.
 */
export function Timeline(props: Props) {
  // The current event comes from ?e=, which is only known in the browser; the pre-rendered bar has none.
  return (
    <Suspense fallback={<TimelineBar {...props} currentEventId={null} />}>
      <TimelineWithEvent {...props} />
    </Suspense>
  );
}

function TimelineWithEvent(props: Props) {
  return <TimelineBar {...props} currentEventId={useSearchParams().get("e")} />;
}

function TimelineBar({ locale, eras, labels, currentEventId }: Props & { currentEventId: string | null }) {
  const ids = eras.map((e) => e.id);
  const { selectedId, index, go, goTo } = useEraNav(locale, ids);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const selectedEra = index === -1 ? null : eras[index];
  const currentEvent = selectedEra?.events.find((ev) => ev.id === currentEventId) ?? null;

  useEffect(() => {
    const key = currentEvent ? `${selectedId}/${currentEvent.id}` : selectedId;
    if (!key) return;
    linkRefs.current.get(key)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [selectedId, currentEvent]);

  const setRef = (key: string) => (el: HTMLAnchorElement | null) => {
    if (el) linkRefs.current.set(key, el);
    else linkRefs.current.delete(key);
  };
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
          {/* pt-3 + link py-1 + half of the h-5 dot row = 1.625rem: the line runs through every dot's centre. */}
          <ol className="relative flex w-max min-w-full pb-3 pt-3" onKeyDown={onKeyDown}>
            <li aria-hidden className="pointer-events-none absolute inset-x-6 top-[calc(1.625rem-0.5px)] h-px bg-line" />
            {eras.map((era) => {
              const selected = era.id === selectedId;
              const count = era.events.length;
              return (
                <li
                  key={era.id}
                  className="flex"
                  // Eras with more marked years get a longer segment.
                  style={{ flex: `${1 + count * 0.12} 1 0`, minWidth: `${9 + count * 1.5}rem` }}
                >
                  <Link
                    ref={setRef(era.id)}
                    href={eraHref(locale, era.id)}
                    aria-current={selected ? "step" : undefined}
                    data-era={era.id}
                    className="group flex w-36 shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1 text-center focus-visible:outline-2 focus-visible:outline-gold"
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
                      {era.title[locale]}
                    </span>
                    <span className="whitespace-nowrap text-xs text-muted">{formatYear(era.start, locale)}</span>
                  </Link>
                  {count > 0 && (
                    <span className="flex flex-1 justify-around px-1">
                      {era.events.map((ev) => {
                        const current = selected && ev.id === currentEvent?.id;
                        const year = formatYear(ev.year, locale, ev.circa);
                        return (
                          <Link
                            key={ev.id}
                            ref={setRef(`${era.id}/${ev.id}`)}
                            href={`${eraHref(locale, era.id)}?e=${ev.id}`}
                            aria-label={`${year} — ${ev.title[locale]}`}
                            title={`${year} — ${ev.title[locale]}`}
                            aria-current={current ? "true" : undefined}
                            data-event={ev.id}
                            className="group relative flex h-7 w-5 justify-center rounded-full py-1 focus-visible:outline-2 focus-visible:outline-gold"
                          >
                            <span className="flex h-5 items-center">
                              <span
                                className={
                                  current
                                    ? "size-3 rounded-full bg-gold ring-2 ring-gold/30"
                                    : "size-2 rounded-full bg-turquoise transition-transform group-hover:scale-150"
                                }
                              />
                            </span>
                            {current && (
                              <span className="absolute top-full whitespace-nowrap text-[0.7rem] font-medium text-gold">
                                {year}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </span>
                  )}
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
