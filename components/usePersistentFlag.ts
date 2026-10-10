"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "iraneum:flag";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage unavailable (private mode)
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * A yes/no setting remembered in this browser (e.g. a collapsed panel). The server HTML always uses
 * `fallback`; the stored value takes over after hydration, so the markup never mismatches.
 */
export function usePersistentFlag(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
  const stored = useSyncExternalStore(subscribe, () => read(key), () => null);
  const value = stored === null ? fallback : stored === "1";
  const set = useCallback(
    (next: boolean) => {
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // Not remembered, but the change below still applies for this page.
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );
  return [value, set];
}
