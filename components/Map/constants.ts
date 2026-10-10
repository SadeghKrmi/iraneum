import { GLOBE_RADIUS } from "@/lib/geo";

/** Height of land above the ocean, in scene units (the globe's radius is 100). */
export const LAND_HEIGHT = 0.35;
export const LAND_RADIUS = GLOBE_RADIUS + LAND_HEIGHT;
/** Land writes this stencil value so territories can be drawn on land only. */
export const LAND_STENCIL = 1;
