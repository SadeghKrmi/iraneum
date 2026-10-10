"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type { AtlasMapProps } from "./AtlasMap";

// Three.js only runs in the browser, and the map is decoration around the story, so it loads after the page.
const AtlasMap = dynamic(() => import("./AtlasMap"), { ssr: false });

/** The 3D map behind everything. data-* attributes expose its state to the browser tests. */
export function MapStage(props: Omit<AtlasMapProps, "onReady">) {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  return (
    <div
      className="fixed inset-0 z-0 bg-bg"
      data-map={ready ? "ready" : "loading"}
      data-map-era={props.era?.id ?? ""}
      data-map-event={props.scene?.at ? props.scene.id : ""}
    >
      <AtlasMap {...props} onReady={onReady} />
    </div>
  );
}
