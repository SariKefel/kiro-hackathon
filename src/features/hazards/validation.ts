import { z } from "zod";

const sourceTimeSchema = z.object({
  raw: z.string().max(100),
  utc: z.iso.datetime().nullable(),
  timezone: z.enum(["utc", "offset", "unspecified"]),
});

const reportUrlSchema = z
  .string()
  .max(1024)
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !url.port &&
        ["earthquake.usgs.gov", "www.gdacs.org", "gdacs.org"].includes(url.hostname)
      );
    } catch {
      return false;
    }
  });

export const hazardEventSchema = z.object({
  id: z.string().min(1).max(160),
  type: z.enum(["earthquake", "flood", "cyclone"]),
  provider: z.enum(["USGS", "GDACS"]),
  feedId: z.enum(["usgs-earthquakes", "gdacs-floods", "gdacs-cyclones"]),
  providerEventId: z.string().min(1).max(100),
  episodeId: z.string().max(100).nullable(),
  title: z.string().max(240),
  location: z.string().max(240),
  countries: z.array(z.string().max(100)).max(20),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  locationRole: z.enum(["epicenter", "representative"]),
  positionalAccuracy: z.string().max(100).nullable(),
  measurements: z
    .array(
      z.object({
        label: z.string().max(120),
        value: z.union([z.number(), z.string().max(240)]),
        unit: z.string().max(40).nullable(),
      }),
    )
    .max(8),
  impact: z
    .object({ overall: z.string().max(100).nullable(), episode: z.string().max(100).nullable() })
    .nullable(),
  sourceStatus: z.string().max(100).nullable(),
  times: z.object({
    occurred: sourceTimeSchema.nullable(),
    periodStart: sourceTimeSchema.nullable(),
    periodEnd: sourceTimeSchema.nullable(),
    observed: sourceTimeSchema.nullable(),
    modified: sourceTimeSchema.nullable(),
  }),
  reportUrl: reportUrlSchema.nullable(),
  retrievedAt: z.iso.datetime(),
  representation: z.string().max(100).nullable(),
});

export const hazardResponseSchema = z.object({
  version: z.literal(1),
  respondedAt: z.iso.datetime(),
  availability: z.enum(["available", "partial", "unavailable"]),
  feeds: z
    .array(
      z.object({
        id: z.enum(["usgs-earthquakes", "gdacs-floods", "gdacs-cyclones"]),
        provider: z.enum(["USGS", "GDACS"]),
        type: z.enum(["earthquake", "flood", "cyclone"]),
        status: z.enum(["ok", "retained", "unavailable"]),
        selection: z.string().max(500),
        retrievedAt: z.iso.datetime().nullable(),
        events: z.array(hazardEventSchema).max(1000),
        diagnostics: z.object({
          invalidRecords: z.number().int().nonnegative(),
          omittedEvents: z.number().int().nonnegative(),
          conflictingLocations: z.number().int().nonnegative(),
          missingLocations: z.number().int().nonnegative(),
          limited: z.boolean(),
          availableCount: z.number().int().nonnegative(),
          displayedCount: z.number().int().nonnegative(),
        }),
        problem: z.string().max(500).nullable(),
        retryAfter: z.iso.datetime().nullable(),
      }),
    )
    .max(3),
});
