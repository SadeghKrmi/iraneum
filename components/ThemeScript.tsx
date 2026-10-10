"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { applyStoredTheme, themeInitScript } from "./ThemeToggle";

const noSubscribe = () => () => {};

/**
 * Sets <html data-theme> before the first paint.
 *
 * The inline script only exists in the server HTML: React must never create a <script> in the browser
 * (it wouldn't run, and React warns about it). That happens when switching language, which swaps the
 * root layout on the client — and drops data-theme, so the layout effect puts it back before paint.
 */
export function ThemeScript() {
  const inServerHtml = useSyncExternalStore(
    noSubscribe,
    () => false,
    () => true,
  );

  useLayoutEffect(() => {
    if (!document.documentElement.dataset.theme) applyStoredTheme();
  }, []);

  return inServerHtml ? <script dangerouslySetInnerHTML={{ __html: themeInitScript }} /> : null;
}
