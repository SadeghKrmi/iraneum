"use client";

import { useEffect, useRef } from "react";

type Props = {
  label: string;
  chips: { id: string; label: string; title: string }[];
  current: number;
  onSelect: (index: number) => void;
};

/** The marked years inside an era. Mirrors in RTL like the main timeline. */
export function EventBar({ label, chips, current, onSelect }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    refs.current[current]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [current]);

  return (
    <div className="overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)] [scrollbar-width:none]">
      <ol aria-label={label} className="relative flex w-max min-w-full gap-1 px-4 py-2">
        <li aria-hidden className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-line" />
        {chips.map((chip, i) => {
          const selected = i === current;
          return (
            <li key={chip.id} className="relative flex flex-1 justify-center">
              <button
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                title={chip.title}
                aria-current={selected ? "step" : undefined}
                data-scene={chip.id}
                onClick={() => onSelect(i)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-gold ${
                  selected
                    ? "border-gold bg-gold font-bold text-bg"
                    : "border-line bg-bg text-fg hover:border-gold hover:text-gold"
                }`}
              >
                {chip.label}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
