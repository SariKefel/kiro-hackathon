"use client";

import { useMemo } from "react";
import { GeographicMap, type GeographicMapProps } from "@/components/maps/geographic-map";
import type { HazardEvent } from "./types";

export interface HazardMapProps extends Omit<GeographicMapProps, "events"> {
  events: HazardEvent[];
}

export function HazardMap({ events, ...props }: HazardMapProps) {
  const points = useMemo(
    () => events.map(({ id, coordinates, type }) => ({ id, coordinates, type })),
    [events],
  );
  return <GeographicMap {...props} events={points} />;
}

export default HazardMap;
