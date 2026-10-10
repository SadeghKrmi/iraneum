"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Locale } from "@/lib/i18n";

export function checkpointHref(locale: Locale, id: string) {
  return `/${locale}/${id}/`;
}

/** Selected checkpoint (from the URL) and helpers to move along the timeline. */
export function useCheckpointNav(locale: Locale, ids: readonly string[]) {
  const router = useRouter();
  const params = useParams<{ checkpoint?: string }>();
  const selectedId = params.checkpoint ?? null;
  const index = selectedId ? ids.indexOf(selectedId) : -1;

  /** Moves `delta` checkpoints forward in time (negative = back). Returns the new id, or null at the ends. */
  const go = useCallback(
    (delta: number) => {
      const target = index === -1 ? (delta > 0 ? 0 : -1) : index + delta;
      if (target < 0 || target >= ids.length) return null;
      router.push(checkpointHref(locale, ids[target]));
      return ids[target];
    },
    [index, ids, locale, router],
  );

  const goTo = useCallback(
    (target: number) => {
      const id = ids[target];
      if (!id) return null;
      router.push(checkpointHref(locale, id));
      return id;
    },
    [ids, locale, router],
  );

  return { selectedId, index, go, goTo };
}
