"use client";

import { MoonIcon, SunIcon } from "./icons";

export const THEME_STORAGE_KEY = "theme";

/** Sets <html data-theme> from the saved choice, or the system preference when nothing is saved. */
export function applyStoredTheme() {
  let theme: string | null = null;
  try {
    theme = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); fall back to the system preference.
  }
  if (theme !== "light" && theme !== "dark") {
    theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
}

/** The same logic as an inline script, run before first paint so the page never flashes the wrong theme. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`;

export function ThemeToggle({ label }: { label: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const current =
      root.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this page only.
    }
  };

  // Both icons are rendered and CSS shows the right one, so server and client markup always match.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full border border-line transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
    >
      <SunIcon className="hidden size-5 dark:block" />
      <MoonIcon className="size-5 dark:hidden" />
    </button>
  );
}
