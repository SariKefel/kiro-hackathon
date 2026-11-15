import { z } from "zod";
import type { CoverageDiagnostics, HazardEvent } from "../types";

const recordSchema = z.object({
  type: z.literal("Feature"),
  id: z.string().min(1).max(100),
  geometry: z.object({ type: z.literal("Point"), coordinates: z.array(z.number()).min(2).max(3) }),
  properties: z.object({
    type: z.literal("earthquake"),
    mag: z.number(),
    magType: z.string().nullable().optional(),
    place: z.string().nullable().optional(),
    title: z.string().optional(),
    time: z.number().int(),
    updated: z.number().int().nullable().optional(),
    url: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
  }),
});

function text(value: string | null | undefined, fallback: string, max = 240) {
  return (value?.replace(/[\u0000-\u001f\u007f]/g, " ").trim() || fallback).slice(0, max);
}

function timestamp(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || Math.abs(value) > 8.64e15) return null;
  const utc = new Date(value).toISOString();
  if (!z.iso.datetime().safeParse(utc).success) return null;
  return { raw: String(value), utc, timezone: "utc" as const };
}

function safeReport(value: string | null | undefined) {
  if (!value || value.length > 1024) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "earthquake.usgs.gov" &&
      !url.username &&
      !url.password &&
      !url.port
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function normalizeUsgs(
  features: unknown[],
  now: number,
  diagnostics: CoverageDiagnostics,
): HazardEvent[] {
  const events: HazardEvent[] = [];
  for (const candidate of features) {
    const parsed = recordSchema.safeParse(candidate);
    if (!parsed.success) {
      diagnostics.invalidRecords++;
      continue;
    }
    const {
      id,
      geometry: { coordinates },
      properties: p,
    } = parsed.data;
    const occurred = timestamp(p.time);
    if (!occurred || p.time < now - 7 * 86400000 || p.time > now || p.mag < 4.5) continue;
    if (Math.abs(coordinates[0]) > 180 || Math.abs(coordinates[1]) > 90) {
      diagnostics.invalidRecords++;
      continue;
    }
    events.push({
      id: `usgs:${id}`,
      type: "earthquake",
      provider: "USGS",
      feedId: "usgs-earthquakes",
      providerEventId: id,
      episodeId: null,
      title: text(p.title, `M ${p.mag} - ${text(p.place, "Location not supplied")}`),
      location: text(p.place, "Location not supplied"),
      countries: [],
      coordinates: [coordinates[0], coordinates[1]],
      locationRole: "epicenter",
      positionalAccuracy: null,
      measurements: [
        {
          label: p.magType
            ? `Magnitude (${text(p.magType, "", 40)})`
            : "Magnitude (type not supplied)",
          value: p.mag,
          unit: null,
        },
        ...(coordinates[2] == null ? [] : [{ label: "Depth", value: coordinates[2], unit: "km" }]),
      ],
      impact: null,
      sourceStatus: p.status ? text(p.status, "", 100) : null,
      times: {
        occurred,
        periodStart: null,
        periodEnd: null,
        observed: null,
        modified: timestamp(p.updated),
      },
      reportUrl: safeReport(p.url),
      retrievedAt: new Date(now).toISOString(),
      representation: null,
    });
  }
  const unique = new Map<string, HazardEvent>();
  const conflicts = new Set<string>();
  for (const event of events) {
    const previous = unique.get(event.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(event)) conflicts.add(event.id);
    else unique.set(event.id, event);
  }
  for (const id of conflicts) {
    unique.delete(id);
    diagnostics.conflictingLocations++;
    diagnostics.omittedEvents++;
  }
  return [...unique.values()];
}
