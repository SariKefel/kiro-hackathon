"use client";

import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HazardEvent, SourceTime } from "./types";

export const HAZARD_LABELS = {
  earthquake: "Earthquake",
  flood: "Flood",
  cyclone: "Tropical cyclone",
};

export function displayTime(time: SourceTime | null) {
  if (!time) return "Not supplied";
  if (!time.utc) return `${time.raw} (source time, timezone unspecified)`;
  const date = new Date(time.utc);
  return `${date.toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC`;
}

export function EventDetails({
  event,
  notice,
  onBack,
}: {
  event: HazardEvent;
  notice?: string;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5 p-5">
      <Button variant="ghost" onClick={onBack} className="-ml-2 min-h-11 px-2">
        <ArrowLeft />
        Back to results
      </Button>
      {notice && (
        <p
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
        >
          {notice}
        </p>
      )}
      <div>
        <p className="text-xs font-medium text-muted-foreground">
          {event.provider} / {HAZARD_LABELS[event.type]}
        </p>
        <h2 tabIndex={-1} data-detail-heading className="mt-2 text-xl font-semibold leading-snug">
          {event.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{event.location}</p>
      </div>
      <div className="rounded-lg bg-secondary p-3 text-xs leading-relaxed">
        <p className="flex items-center gap-2 font-semibold">
          <MapPin className="size-4 shrink-0" />
          {event.locationRole === "epicenter"
            ? "Earthquake epicenter"
            : "Provider Representative Location"}
        </p>
        <p className="mt-2">
          {event.locationRole === "representative"
            ? "This point represents a provider report. It is not an affected boundary or a verified current cyclone position."
            : "This point marks the reported earthquake epicenter. It does not show the area affected by shaking."}
        </p>
        <p className="mt-2">Positional accuracy: {event.positionalAccuracy ?? "not supplied"}.</p>
        <p className="mt-1">
          {event.coordinates[1].toFixed(3)}°, {event.coordinates[0].toFixed(3)}°
        </p>
      </div>
      <dl className="space-y-3 text-sm">
        {event.measurements.map((measurement, i) => (
          <Detail key={`${measurement.label}-${i}`} label={measurement.label}>
            {measurement.value}
            {measurement.unit ? ` ${measurement.unit}` : ""}
          </Detail>
        ))}
        {event.impact?.overall && (
          <Detail label="GDACS overall impact level">{event.impact.overall}</Detail>
        )}
        {event.impact?.episode && (
          <Detail label="GDACS episode impact level">{event.impact.episode}</Detail>
        )}
        {event.times.occurred && (
          <Detail label="Earthquake occurrence">{displayTime(event.times.occurred)}</Detail>
        )}
        {(event.times.periodStart || event.times.periodEnd) && (
          <Detail label="GDACS reported period">
            {displayTime(event.times.periodStart)} to {displayTime(event.times.periodEnd)}
          </Detail>
        )}
        {event.type !== "earthquake" && (
          <Detail label="Observation time">
            {event.times.observed
              ? displayTime(event.times.observed)
              : "Not supplied for this representative location"}
          </Detail>
        )}
        <Detail label="Source record modified">{displayTime(event.times.modified)}</Detail>
        <Detail label="Successfully retrieved">
          {new Date(event.retrievedAt).toLocaleString("en-GB", {
            timeZone: "UTC",
            dateStyle: "medium",
            timeStyle: "short",
          })}{" "}
          UTC
        </Detail>
        {event.countries.length > 0 && (
          <Detail label="Provider-reported countries">{event.countries.join(", ")}</Detail>
        )}
        {event.sourceStatus && <Detail label="Source-native status">{event.sourceStatus}</Detail>}
        <Detail label="Provider event ID">{event.providerEventId}</Detail>
        {event.episodeId && <Detail label="Provider episode ID">{event.episodeId}</Detail>}
        {event.representation && (
          <Detail label="Provider representation">{event.representation}</Detail>
        )}
      </dl>
      {event.type !== "earthquake" && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          GDACS current-list membership and reported periods do not establish continuing danger.
          Impact labels are source-native and are not comparable with earthquake magnitude.
        </p>
      )}
      {event.reportUrl ? (
        <Button asChild className="min-h-11 w-full">
          <a href={event.reportUrl} target="_blank" rel="noopener noreferrer">
            Open original {event.provider} report
            <ExternalLink />
          </a>
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          A valid original report link was not supplied.
        </p>
      )}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words leading-relaxed">{children}</dd>
    </div>
  );
}
