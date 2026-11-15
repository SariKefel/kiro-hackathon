import { z } from "zod";
import type { CoverageDiagnostics, FeedId, FeedSnapshot, HazardResponse } from "../types";
import { normalizeUsgs } from "../providers/usgs";
import { normalizeGdacs } from "../providers/gdacs";
import { FEEDS } from "./feeds";
import { FeedFailure, retrieveJson } from "./transport";
import { boundCoverage } from "./coverage";

export interface QueryDependencies {
  transport?: (url: string, init?: RequestInit) => Promise<Response>;
  now?: () => number;
  cacheSnapshot?: (id: FeedId, retrieve: () => Promise<FeedSnapshot>) => Promise<FeedSnapshot>;
}

function diagnostics(): CoverageDiagnostics {
  return {
    invalidRecords: 0,
    omittedEvents: 0,
    conflictingLocations: 0,
    missingLocations: 0,
    limited: false,
    availableCount: 0,
    displayedCount: 0,
  };
}

const envelopeSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(z.unknown()),
});

export function createHazardQuery({
  transport = fetch,
  now = Date.now,
  cacheSnapshot,
}: QueryDependencies = {}) {
  const snapshots = new Map<FeedId, FeedSnapshot>();
  const inFlight = new Map<FeedId, Promise<FeedSnapshot>>();
  const failures = new Map<FeedId, { until: number; problem: string; retryAfter: string | null }>();
  return async (): Promise<HazardResponse> => {
    const feeds = await Promise.all(
      FEEDS.map(async (feed): Promise<FeedSnapshot> => {
        const previous = snapshots.get(feed.id);
        const failure = failures.get(feed.id);
        if (previous && !failure && now() - Date.parse(previous.retrievedAt!) < 300000)
          return structuredClone(previous);
        const unavailable = (): FeedSnapshot =>
          previous
            ? {
                ...structuredClone(previous),
                status: "retained",
                retryAfter: failures.get(feed.id)?.retryAfter ?? null,
                problem:
                  failures.get(feed.id)?.problem ??
                  "Previous snapshot retained while source retrieval recovers",
              }
            : {
                id: feed.id,
                provider: feed.provider,
                type: feed.type,
                status: "unavailable",
                selection: feed.selection,
                retrievedAt: null,
                events: [],
                diagnostics: diagnostics(),
                problem: failures.get(feed.id)?.problem ?? "Source retrieval unavailable",
                retryAfter: failures.get(feed.id)?.retryAfter ?? null,
              };
        if (failure && failure.until > now()) return unavailable();
        let pending = inFlight.get(feed.id);
        if (!pending) {
          const retrieve = async (): Promise<FeedSnapshot> => {
            const coverage = diagnostics();
            try {
              const body = envelopeSchema.parse(await retrieveJson(feed.url, transport, now));
              const at = now();
              const events =
                feed.provider === "USGS"
                  ? normalizeUsgs(body.features, at, coverage)
                  : normalizeGdacs(
                      body.features,
                      feed.type === "flood" ? "FL" : "TC",
                      at,
                      coverage,
                    );
              coverage.availableCount = events.length;
              coverage.displayedCount = events.length;
              const snapshot: FeedSnapshot = {
                id: feed.id,
                provider: feed.provider,
                type: feed.type,
                status: "ok",
                selection: feed.selection,
                retrievedAt: new Date(at).toISOString(),
                events,
                diagnostics: coverage,
                problem: null,
                retryAfter: null,
              };
              snapshots.set(feed.id, snapshot);
              failures.delete(feed.id);
              return snapshot;
            } catch (error) {
              failures.set(feed.id, {
                until:
                  error instanceof FeedFailure
                    ? (error.retryUntil ?? now() + 30000)
                    : now() + 30000,
                retryAfter:
                  error instanceof FeedFailure && error.retryUntil
                    ? new Date(error.retryUntil).toISOString()
                    : null,
                problem:
                  error instanceof FeedFailure ? error.message : "Source retrieval unavailable",
              });
              throw error;
            }
          };
          pending = (cacheSnapshot ? cacheSnapshot(feed.id, retrieve) : retrieve()).finally(() =>
            inFlight.delete(feed.id),
          );
          inFlight.set(feed.id, pending);
        }
        try {
          const snapshot = await pending;
          snapshots.set(feed.id, snapshot);
          if (failures.has(feed.id) || now() - Date.parse(snapshot.retrievedAt!) >= 300000)
            return {
              ...structuredClone(snapshot),
              status: "retained",
              retryAfter: failures.get(feed.id)?.retryAfter ?? null,
              problem:
                failures.get(feed.id)?.problem ??
                "Previously retrieved snapshot; revalidation is pending",
            };
          return structuredClone(snapshot);
        } catch {
          return unavailable();
        }
      }),
    );
    const usable = feeds.filter((feed) => feed.status !== "unavailable").length;
    return boundCoverage({
      version: 1,
      respondedAt: new Date(now()).toISOString(),
      availability: !usable
        ? "unavailable"
        : feeds.every((feed) => feed.status === "ok")
          ? "available"
          : "partial",
      feeds,
    });
  };
}

export function responseStatus(response: HazardResponse) {
  return response.availability === "unavailable" ? 503 : 200;
}
