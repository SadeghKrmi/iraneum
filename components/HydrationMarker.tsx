"use client";

import { useEffect } from "react";

/** Marks <body data-hydrated> once React is interactive (used by the browser tests). */
export function HydrationMarker() {
  useEffect(() => {
    document.body.dataset.hydrated = "true";
  }, []);
  return null;
}
