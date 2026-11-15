import { z } from "zod";
import type { CoverageDiagnostics, HazardEvent, SourceTime } from "../types";

const identifier = z
  .union([z.number().int().positive(), z.string().regex(/^\d{1,30}$/)])
  .transform(String);
const candidateSchema = z.object({
  type: z.literal("Feature"),
  geometry: z.object({ type: z.string(), coordinates: z.unknown() }).nullable(),
  properties: z
    .object({
      eventtype: z.enum(["FL", "TC"]),
      eventid: identifier,
      episodeid: identifier.nullable().optional(),
      Class: z.string(),
    })
    .passthrough(),
});
const pointSchema = z
  .array(z.number())
  .min(2)
  .max(3)
  .refine(([longitude, latitude]) => Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90);

function text(value: unknown, fallback = "", max = 240) {
  return (
    typeof value === "string"
      ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim() || fallback
      : fallback
  ).slice(0, max);
}

function sourceTime(value: unknown): SourceTime | null {
  if (
    typeof value !== "string" ||
    value.length > 100 ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
  )
    return null;
  if (!z.iso.datetime({ offset: true, local: true }).safeParse(value).success) return null;
  const explicitOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const parsed = Date.parse(explicitOffset ? value : `${value}Z`);
  if (!Number.isFinite(parsed)) return null;
  return {
    raw: value,
    utc: explicitOffset ? new Date(parsed).toISOString() : null,
    timezone: explicitOffset ? (/Z$/i.test(value) ? "utc" : "offset") : "unspecified",
  };
}

function reportUrl(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    !("report" in value) ||
    typeof value.report !== "string" ||
    value.report.length > 1024
  )
    return null;
  try {
    const url = new URL(value.report);
    return url.protocol === "https:" &&
      ["www.gdacs.org", "gdacs.org"].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function normalizeGdacs(
  features: unknown[],
  eventType: "FL" | "TC",
  now: number,
  diagnostics: CoverageDiagnostics,
): HazardEvent[] {
  type Candidate = z.infer<typeof candidateSchema>;
  const grouped = new Map<string, Candidate[]>();
  for (const feature of features) {
    const result = candidateSchema.safeParse(feature);
    if (!result.success || result.data.properties.eventtype !== eventType) {
      diagnostics.invalidRecords++;
      continue;
    }
    const key = result.data.properties.eventid;
    const group = grouped.get(key) ?? [];
    group.push(result.data);
    grouped.set(key, group);
  }
  const events: HazardEvent[] = [];
  for (const [id, representations] of grouped) {
    const eligible = representations.filter((candidate) => {
      if (candidate.properties.Class !== "Point_Centroid" || candidate.geometry?.type !== "Point")
        return false;
      if (!pointSchema.safeParse(candidate.geometry.coordinates).success) {
        diagnostics.invalidRecords++;
        return false;
      }
      return true;
    });
    if (!eligible.length) {
      diagnostics.missingLocations++;
      diagnostics.omittedEvents++;
      continue;
    }
    const normalized = eligible.map(({ geometry, properties: p }): HazardEvent => {
      const coordinates = pointSchema.parse(geometry!.coordinates);
      const severity = z
        .object({
          severity: z.number(),
          severityunit: z.string(),
          severitytext: z.string().optional(),
        })
        .safeParse(p.severitydata);
      const measurements: HazardEvent["measurements"] = [];
      if (severity.success && severity.data.severityunit.trim()) {
        measurements.push({
          label: text(severity.data.severitytext, "Source measurement", 120),
          value: severity.data.severity,
          unit: text(severity.data.severityunit, "", 40),
        });
      }
      const countries = z
        .array(z.object({ countryname: z.string() }))
        .safeParse(p.affectedcountries);
      return {
        id: `gdacs:${eventType}:${id}`,
        type: eventType === "FL" ? "flood" : "cyclone",
        provider: "GDACS",
        feedId: eventType === "FL" ? "gdacs-floods" : "gdacs-cyclones",
        providerEventId: id,
        episodeId: p.episodeid ?? null,
        title: text(p.name, eventType === "FL" ? "Flood report" : "Tropical cyclone report"),
        location: text(p.country, "Location represented by provider point"),
        countries: countries.success
          ? [
              ...new Set(
                countries.data.map(({ countryname }) => text(countryname, "", 100)).filter(Boolean),
              ),
            ].slice(0, 20)
          : [],
        coordinates: [coordinates[0], coordinates[1]],
        locationRole: "representative",
        positionalAccuracy: null,
        measurements,
        impact: {
          overall: text(p.alertlevel, "", 100) || null,
          episode: text(p.episodealertlevel, "", 100) || null,
        },
        sourceStatus: text(p.iscurrent, "", 100)
          ? `Current-list field: ${text(p.iscurrent, "", 75)}`
          : null,
        times: {
          occurred: null,
          periodStart: sourceTime(p.fromdate),
          periodEnd: sourceTime(p.todate),
          observed: null,
          modified: sourceTime(p.datemodified),
        },
        reportUrl: reportUrl(p.url),
        retrievedAt: new Date(now).toISOString(),
        representation: "Point_Centroid",
      };
    });
    const signatures = new Set(normalized.map((event) => JSON.stringify(event)));
    if (signatures.size > 1) {
      diagnostics.conflictingLocations++;
      diagnostics.omittedEvents++;
      continue;
    }
    events.push(normalized[0]);
  }
  return events;
}
