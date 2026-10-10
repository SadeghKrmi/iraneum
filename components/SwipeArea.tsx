"use client";

import { useRef } from "react";
import { dirOf, type Locale } from "@/lib/i18n";
import { useCheckpointNav } from "./useCheckpointNav";

const MIN_SWIPE_PX = 60;

type Props = { locale: Locale; checkpointIds: string[]; children: React.ReactNode };

/** Main stage. On touch screens, a horizontal swipe moves to the next/previous checkpoint. */
export function SwipeArea({ locale, checkpointIds, children }: Props) {
  const { go } = useCheckpointNav(locale, checkpointIds);
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <main
      className="flex flex-1 touch-pan-y items-center justify-center px-4 py-10 sm:px-8"
      onPointerDown={(e) => {
        start.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        if (!start.current) return;
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        start.current = null;
        if (Math.abs(dx) < MIN_SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        // Swiping against the reading direction moves forward in time.
        const forward = dirOf(locale) === "rtl" ? dx > 0 : dx < 0;
        go(forward ? 1 : -1);
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      {children}
    </main>
  );
}
