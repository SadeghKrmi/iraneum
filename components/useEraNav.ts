"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Locale } from "@/lib/i18n";
import { eraHref } from "@/lib/routes";

/** Selected era (from the URL) and helpers to move along the timeline. */
export function useEraNav(locale: Locale, ids: readonly string[]) {
  const router = useRouter();
  const params = useParams<{ era?: string }>();
  const index = params.era ? ids.indexOf(params.era) : -1;
  const selectedId = index === -1 ? null : ids[index];

  /** Opens the era at `target`. Returns its id, or null when out of range. */
  const goTo = useCallback(
    (target: number) => {
      const id = ids[target];
      if (!id) return null;
      router.push(eraHref(locale, id));
      return id;
    },
    [ids, locale, router],
  );

  /** Moves `delta` eras forward in time (negative = back). From the landing page, forward opens the first era. */
  const go = useCallback(
    (delta: number) => goTo(index === -1 ? (delta > 0 ? 0 : -1) : index + delta),
    [goTo, index],
  );

  return { selectedId, index, go, goTo };
}
