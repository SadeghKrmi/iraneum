"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { Vector3 } from "three";
import { toSphere, type LonLat } from "@/lib/geo";
import { LAND_RADIUS } from "./constants";

export type MapLabel = {
  id: string;
  at: LonLat;
  /** Height above the land, in scene units. */
  height: number;
  /** Labels with a higher priority are placed first. */
  priority?: number;
  /** Hidden while it would overlap a label placed before it (otherwise always shown). */
  yields?: boolean;
  content: React.ReactNode;
};

export type LabelElements = Map<string, HTMLElement>;

/**
 * Map labels as plain DOM next to the canvas (HTML text keeps Persian shaping and RTL right).
 * They are positioned every frame by <LabelProjector> without re-rendering React.
 */
export function LabelLayer({ labels, elements }: { labels: MapLabel[]; elements: LabelElements }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {labels.map((label) => (
        <div
          key={label.id}
          ref={(el) => {
            if (el) elements.set(label.id, el);
            else elements.delete(label.id);
          }}
          className="absolute left-0 top-0 will-change-transform"
          style={{ visibility: "hidden" }}
          data-label={label.id}
        >
          {label.content}
        </div>
      ))}
    </div>
  );
}

const point = new Vector3();
const normal = new Vector3();
const toCamera = new Vector3();

/** Screen boxes (x0, y0, x1, y1) of the labels placed so far in a frame. */
const placed: number[] = [];
const GAP = 4;

/**
 * Inside the canvas: moves each label to its point on screen; hides it on the far side of the globe,
 * and hides a label that yields when it would overlap one placed before it.
 */
export function LabelProjector({ labels, elements }: { labels: MapLabel[]; elements: LabelElements }) {
  const ordered = useMemo(() => [...labels].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)), [labels]);
  // Label sizes, measured once per label (a label whose content changes is a new object).
  const [sizes] = useState(() => new WeakMap<MapLabel, { w: number; h: number }>());
  useFrame(({ camera, size }) => {
    placed.length = 0;
    for (const label of ordered) {
      const el = elements.get(label.id);
      if (!el) continue;
      toSphere(label.at, LAND_RADIUS + label.height, point);
      normal.copy(point).normalize();
      toCamera.copy(camera.position).sub(point);
      const facing = normal.dot(toCamera.normalize()) > 0.05;
      point.project(camera);
      const visible = facing && point.z < 1;
      el.style.visibility = visible ? "visible" : "hidden";
      if (!visible) continue;
      const x = ((point.x + 1) / 2) * size.width;
      const y = ((1 - point.y) / 2) * size.height;
      let box = sizes.get(label);
      if (!box) sizes.set(label, (box = { w: el.offsetWidth, h: el.offsetHeight }));
      const [x0, y0, x1, y1] = [x - box.w / 2 - GAP, y - box.h / 2 - GAP, x + box.w / 2 + GAP, y + box.h / 2 + GAP];
      if (label.yields && overlapsPlaced(x0, y0, x1, y1)) {
        el.style.visibility = "hidden";
        continue;
      }
      placed.push(x0, y0, x1, y1);
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }
  });
  return null;
}

function overlapsPlaced(x0: number, y0: number, x1: number, y1: number) {
  for (let i = 0; i < placed.length; i += 4) {
    if (x0 < placed[i + 2] && x1 > placed[i] && y0 < placed[i + 3] && y1 > placed[i + 1]) return true;
  }
  return false;
}
