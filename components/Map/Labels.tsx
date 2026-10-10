"use client";

import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { toSphere, type LonLat } from "@/lib/geo";
import { LAND_RADIUS } from "./constants";

export type MapLabel = {
  id: string;
  at: LonLat;
  /** Height above the land, in scene units. */
  height: number;
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

/** Inside the canvas: moves each label to its point on screen; hides it on the far side of the globe. */
export function LabelProjector({ labels, elements }: { labels: MapLabel[]; elements: LabelElements }) {
  useFrame(({ camera, size }) => {
    for (const label of labels) {
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
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }
  });
  return null;
}
