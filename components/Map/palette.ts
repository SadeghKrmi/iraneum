"use client";

import { useSyncExternalStore } from "react";

export type MapPalette = {
  /** Space around the globe. */
  background: string;
  atmosphere: string;
  sea: string;
  land: string;
  coast: string;
  iranBorder: string;
  capital: string;
  label: string;
  /** Battle titles: red-tinted, readable on this theme's land. */
  battleLabel: string;
  labelShadow: string;
};

const palettes: Record<"light" | "dark", MapPalette> = {
  dark: {
    background: "#070c1a",
    atmosphere: "#5b8fd6",
    sea: "#0f1d3a",
    land: "#4a4e6e",
    coast: "#8c97bf",
    iranBorder: "#c9cfdf",
    capital: "#d9a441",
    label: "#f3ead8",
    battleLabel: "#ffb4a5",
    labelShadow: "0 1px 3px #000, 0 0 10px #000",
  },
  light: {
    background: "#efe8d8",
    atmosphere: "#8fb8de",
    sea: "#b6cbdd",
    land: "#efe5cf",
    coast: "#7d93ad",
    iranBorder: "#4b5468",
    capital: "#8a5d0c",
    label: "#1f2433",
    battleLabel: "#a12d1a",
    labelShadow: "0 0 4px #fffaf0, 0 0 10px #fffaf0",
  },
};

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** Map colours for the current light/dark theme; follows the theme toggle live. */
export function useMapPalette(): MapPalette {
  const theme = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === "light" ? "light" : "dark"),
    () => "dark" as const,
  );
  return palettes[theme];
}

export const eventColors = {
  battle: "#e0583f",
  monument: "#d9a441",
  city: "#7fa8e8",
  event: "#7fa8e8",
} as const;
