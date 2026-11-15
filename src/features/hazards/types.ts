export type HazardType = "earthquake" | "flood" | "cyclone";
export type FeedId = "usgs-earthquakes" | "gdacs-floods" | "gdacs-cyclones";
export type Provider = "USGS" | "GDACS";

export interface SourceTime {
  raw: string;
  utc: string | null;
  timezone: "utc" | "offset" | "unspecified";
}

export interface HazardEvent {
  id: string;
  type: HazardType;
  provider: Provider;
  feedId: FeedId;
  providerEventId: string;
  episodeId: string | null;
  title: string;
  location: string;
  countries: string[];
  coordinates: [number, number];
  locationRole: "epicenter" | "representative";
  positionalAccuracy: string | null;
  measurements: { label: string; value: number | string; unit: string | null }[];
  impact: { overall: string | null; episode: string | null } | null;
  sourceStatus: string | null;
  times: {
    occurred: SourceTime | null;
    periodStart: SourceTime | null;
    periodEnd: SourceTime | null;
    observed: SourceTime | null;
    modified: SourceTime | null;
  };
  reportUrl: string | null;
  retrievedAt: string;
  representation: string | null;
}

export interface CoverageDiagnostics {
  invalidRecords: number;
  omittedEvents: number;
  conflictingLocations: number;
  missingLocations: number;
  limited: boolean;
  availableCount: number;
  displayedCount: number;
}

export interface FeedSnapshot {
  id: FeedId;
  provider: Provider;
  type: HazardType;
  status: "ok" | "retained" | "unavailable";
  selection: string;
  retrievedAt: string | null;
  events: HazardEvent[];
  diagnostics: CoverageDiagnostics;
  problem: string | null;
  retryAfter: string | null;
}

export interface HazardResponse {
  version: 1;
  respondedAt: string;
  availability: "available" | "partial" | "unavailable";
  feeds: FeedSnapshot[];
}

export type RegionPreset = "malaysia" | "southeast-asia" | "world";
export interface ViewportBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}
export interface CameraRequest {
  sequence: number;
  preset?: RegionPreset;
  coordinates?: [number, number];
}
