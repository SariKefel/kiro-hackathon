import type { RegionPreset, ViewportBounds } from "../types";

export const REGION_BOUNDS: Record<RegionPreset, ViewportBounds> = {
  malaysia: { west: 98, south: 0, east: 120, north: 9 },
  "southeast-asia": { west: 90, south: -12, east: 142, north: 28 },
  world: { west: -180, south: -70, east: 180, north: 75 },
};
