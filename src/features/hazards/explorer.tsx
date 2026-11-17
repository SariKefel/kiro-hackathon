"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, List, LoaderCircle, RefreshCw, TriangleAlert, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventDetails, HAZARD_LABELS } from "./event-details";
import { HazardMap } from "./hazard-map";
import { useHazards } from "./use-hazards";
import type {
  CameraRequest,
  FeedSnapshot,
  HazardEvent,
  HazardResponse,
  HazardType,
  RegionPreset,
  ViewportBounds,
} from "./types";

const TYPES: HazardType[] = ["earthquake", "flood", "cyclone"];
const PRESETS: { id: RegionPreset; label: string }[] = [
  { id: "malaysia", label: "Malaysia" },
  { id: "southeast-asia", label: "Southeast Asia" },
  { id: "world", label: "World" },
];
const SYMBOLS = { earthquake: "E", flood: "F", cyclone: "C" };
const SYMBOL_CLASSES = {
  earthquake: "bg-quake text-brand-ink",
  flood: "bg-flood text-brand-ink",
  cyclone: "bg-cyclone text-brand-ink",
};
const INITIAL_BOUNDS = { west: 90, south: -12, east: 142, north: 28 };

function subscribeMobile(listener: () => void) {
  const media = window.matchMedia("(max-width: 767px)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
function mobileSnapshot() {
  return window.matchMedia("(max-width: 767px)").matches;
}
function desktopSnapshot() {
  return false;
}

function inView(event: HazardEvent, bounds: ViewportBounds | null) {
  if (!bounds) return true;
  const [longitude, latitude] = event.coordinates;
  if (latitude < bounds.south || latitude > bounds.north) return false;
  if (bounds.east - bounds.west >= 360) return true;
  const wrap = (value: number) => ((((value + 180) % 360) + 360) % 360) - 180;
  const west = wrap(bounds.west),
    east = wrap(bounds.east),
    point = wrap(longitude);
  return west <= east ? point >= west && point <= east : point >= west || point <= east;
}

export function DisasterExplorer() {
  const [selection, setSelection] = useState<{ id: string; record: HazardEvent } | null>(null);
  const rememberSelection = useCallback((response: HazardResponse) => {
    setSelection((current) => {
      if (!current) return current;
      const updated = response.feeds
        .flatMap((feed) => feed.events)
        .find((event) => event.id === current.id);
      return updated ? { id: current.id, record: updated } : current;
    });
  }, []);
  const { data, error, isLoading, isRefreshing, now, online, visible, retry, retryIn } =
    useHazards(rememberSelection);
  const [enabled, setEnabled] = useState<Record<HazardType, boolean>>({
    earthquake: true,
    flood: true,
    cyclone: true,
  });
  const [bounds, setBounds] = useState<ViewportBounds | null>(INITIAL_BOUNDS);
  const [region, setRegion] = useState<RegionPreset>("southeast-asia");
  const [cameraRequest, setCameraRequest] = useState<CameraRequest | null>(null);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [sheetOpen, setSheetOpen] = useState(false);
  const mobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, desktopSnapshot);
  const panel = useRef<HTMLDivElement | null>(null);
  const resultsTrigger = useRef<HTMLButtonElement | null>(null);
  const lastResult = useRef<string | null>(null);
  const sequence = useRef(0);
  const events = useMemo(() => data?.feeds.flatMap((feed) => feed.events) ?? [], [data]);
  const filtered = useMemo(() => events.filter((event) => enabled[event.type]), [events, enabled]);
  const results = useMemo(
    () => filtered.filter((event) => inView(event, bounds)),
    [filtered, bounds],
  );
  const selectedId = selection?.id ?? null;
  const current = selection ? events.find((event) => event.id === selection.id) : null;
  const selected = current ?? selection?.record;
  const selectedFeed = selected
    ? data?.feeds.find((feed) => feed.id === selected.feedId)
    : undefined;
  const notices: string[] = [];
  if (selection && !current)
    notices.push(
      "This event is no longer listed in the loaded feed. Showing the last inspected report.",
    );
  if (selected && !enabled[selected.type])
    notices.push("The selected event is excluded by your hazard filters.");
  if (selectedFeed?.status === "retained" || (selected && error))
    notices.push("This report was loaded previously. Its source could not be refreshed.");

  const selectEvent = useCallback(
    (id: string, focusMap = false) => {
      const record = events.find((event) => event.id === id);
      if (!record) return;
      lastResult.current = id;
      setSelection({ id, record });
      if (focusMap && !inView(record, bounds)) {
        setCameraRequest({ sequence: ++sequence.current, coordinates: record.coordinates });
      }
      if (mobile) setSheetOpen(true);
    },
    [events, bounds, mobile],
  );

  const selectOnMap = useCallback((id: string) => selectEvent(id), [selectEvent]);
  const selectRegion = (preset: RegionPreset) => {
    setRegion(preset);
    setCameraRequest({ sequence: ++sequence.current, preset });
  };
  const back = () => {
    setSelection(null);
    requestAnimationFrame(() => {
      const item =
        lastResult.current &&
        panel.current?.querySelector<HTMLButtonElement>(
          `[data-event-id="${CSS.escape(lastResult.current)}"]`,
        );
      if (item) item.focus();
      else panel.current?.querySelector<HTMLElement>("[data-results-heading]")?.focus();
    });
  };

  useEffect(() => {
    if (!selectedId || (mobile && !sheetOpen)) return;
    const frame = requestAnimationFrame(() =>
      panel.current?.querySelector<HTMLElement>("[data-detail-heading]")?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [selectedId, mobile, sheetOpen]);

  const content = (
    <div ref={panel} className="h-full overflow-y-auto overscroll-contain">
      {selected ? (
        <EventDetails event={selected} notice={notices.join(" ") || undefined} onBack={back} />
      ) : (
        <Results
          events={results}
          total={filtered.length}
          loading={isLoading}
          unavailable={
            (!data && !!error) || (data?.availability === "unavailable" && events.length === 0)
          }
          mapUnavailable={mapStatus === "unavailable"}
          enabledCount={TYPES.filter((type) => enabled[type]).length}
          onSelect={(id) => selectEvent(id, true)}
          onWiden={() => selectRegion("world")}
        />
      )}
    </div>
  );

  return (
    <section className="disaster-explorer flex h-[calc(100dvh-140px)] flex-col md:h-[calc(100dvh-76px)]">
      <div data-tour="hazard-intro" className="shrink-0 border-b px-5 py-3 md:px-7 md:py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-title">Disaster Explorer</h1>
            <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-muted-foreground sm:block">
              Explore regional hazard reports. Select a location to inspect its original source.
            </p>
            <p className="mt-2 text-xs font-medium text-signal-text">
              Public hazard reports in a demo workspace
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="sr-only text-xs text-muted-foreground sm:not-sr-only" role="status">
              {!online
                ? "Offline - refresh paused"
                : !visible
                  ? "Refresh paused while hidden"
                  : isRefreshing
                    ? "Retrieving reports…"
                    : "Checks for updates every 5 minutes"}
            </span>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={!online || !visible || isRefreshing || retryIn > 0}
              onClick={retry}
              aria-label={
                retryIn > 0
                  ? `Refresh hazard reports - retry in ${retryIn} seconds`
                  : "Refresh hazard reports"
              }
            >
              <RefreshCw
                className={cn("size-4", isRefreshing && "animate-spin motion-reduce:animate-none")}
              />
              <span className="hidden sm:inline">
                {retryIn > 0 ? `Retry in ${retryIn}s` : "Refresh"}
              </span>
            </Button>
          </div>
        </div>
        {error && (
          <p
            role="status"
            className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-caution"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            Reports could not be refreshed. Previously loaded reports remain available with their
            original retrieval times.
          </p>
        )}
      </div>

      <div className="shrink-0 border-b bg-card">
        {mobile ? (
          <details className="px-5 py-2">
            <summary className="min-h-8 cursor-pointer py-1 text-xs font-medium">
              Sources and update status{" "}
              {data ? `/ ${data.feeds.filter((feed) => feed.retrievedAt).length} of 3 loaded` : ""}
              {!online && " / Offline"}
              {data?.feeds.some(
                (feed) => feed.retrievedAt && now && now - Date.parse(feed.retrievedAt) >= 900_000,
              ) && " / Refresh delayed"}
            </summary>
            <div
              className="max-h-44 space-y-2 overflow-y-auto pt-2"
              role="group"
              aria-label="Source feed health"
            >
              {data?.feeds.map((feed) => (
                <FeedHealth key={feed.id} feed={feed} now={now} retrievalFailed={!!error} />
              )) ?? (
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Loading source feeds…" : "No successful retrieval"}
                </p>
              )}
            </div>
          </details>
        ) : (
          <div
            className="grid gap-2 px-5 py-3 sm:grid-cols-3 md:px-7"
            role="group"
            aria-label="Source feed health"
          >
            {data?.feeds.map((feed) => (
              <FeedHealth key={feed.id} feed={feed} now={now} retrievalFailed={!!error} />
            )) ??
              TYPES.map((type) => (
                <div key={type} className="text-xs text-muted-foreground">
                  {HAZARD_LABELS[type]}: {isLoading ? "Loading…" : "No successful retrieval"}
                </div>
              ))}
          </div>
        )}
      </div>

      <div
        data-tour="hazard-filters"
        className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-5 py-3 md:px-7"
      >
        <div
          role="group"
          aria-label="Region presets"
          className="flex rounded-lg border bg-card p-1"
        >
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={region === preset.id}
              onClick={() => selectRegion(preset.id)}
              className={cn(
                "min-h-11 rounded-md px-3 text-xs font-medium transition-colors",
                region === preset.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Hazard types and marker legend</legend>
          {TYPES.map((type) => (
            <button
              type="button"
              key={type}
              aria-pressed={enabled[type]}
              aria-label={HAZARD_LABELS[type]}
              onClick={() => setEnabled((previous) => ({ ...previous, [type]: !previous[type] }))}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-lg border px-3 text-xs transition-colors",
                enabled[type]
                  ? "border-foreground/25 bg-card"
                  : "border-dashed bg-secondary text-muted-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-xs font-semibold",
                  SYMBOL_CLASSES[type],
                )}
              >
                {SYMBOLS[type]}
              </span>
              <span className={type === "cyclone" ? "hidden sm:inline" : undefined}>
                {HAZARD_LABELS[type]}
              </span>
              {type === "cyclone" && <span className="sm:hidden">Cyclone</span>}
              {enabled[type] ? "" : " hidden"}
            </button>
          ))}
        </fieldset>
      </div>

      <div className="relative min-h-0 flex-1 md:grid md:grid-cols-[minmax(0,1fr)_360px]">
        <div
          data-tour="hazard-map"
          className={cn("relative min-w-0 md:!h-full", mobile && sheetOpen ? "h-[40%]" : "h-full")}
        >
          <HazardMap
            events={filtered}
            selectedId={selection?.id ?? null}
            cameraRequest={cameraRequest}
            onSelect={selectOnMap}
            onViewportChange={setBounds}
            onStatusChange={setMapStatus}
          />
          {!sheetOpen && mobile && (
            <Button
              ref={resultsTrigger}
              variant="default"
              onClick={() => setSheetOpen(true)}
              className="absolute bottom-12 left-1/2 z-10 min-h-11 -translate-x-1/2 shadow-md"
            >
              <List />
              View {results.length} reports
            </Button>
          )}
        </div>
        {!mobile && (
          <aside
            aria-label="Hazard inspection"
            className="hidden min-h-0 border-l bg-card md:block"
          >
            {content}
          </aside>
        )}
        {mobile && (
          <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen} modal={false}>
            <Dialog.Content
              className="absolute inset-x-0 bottom-0 z-20 flex h-[60%] flex-col rounded-t-2xl border-t bg-card shadow-sheet outline-none"
              onInteractOutside={(event) => event.preventDefault()}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                resultsTrigger.current?.focus();
              }}
            >
              <div className="flex shrink-0 items-center justify-between border-b px-5 py-2">
                <Dialog.Title className="text-sm font-semibold">
                  {selected ? "Event details" : "Reported locations"}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label="Close reports sheet"
                  >
                    <X />
                  </Button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">
                Inspect source-attributed public reports. Close this sheet to return to the map.
              </Dialog.Description>
              <div className="min-h-0 flex-1">{content}</div>
            </Dialog.Content>
          </Dialog.Root>
        )}
      </div>
      <p className="shrink-0 border-t px-5 py-2 text-xs leading-relaxed text-muted-foreground md:px-7">
        <span className="hidden sm:inline">
          Markers show earthquake epicenters or provider-reported points, not affected areas.
          Missing markers do not establish safety or complete coverage.{" "}
        </span>
        <span className="sm:hidden">
          Reported points do not establish affected areas or safety.{" "}
        </span>
        Sources:{" "}
        <a
          className="underline underline-offset-2"
          href="https://earthquake.usgs.gov/"
          target="_blank"
          rel="noopener noreferrer"
        >
          USGS
        </a>{" "}
        and{" "}
        <a
          className="underline underline-offset-2"
          href="https://www.gdacs.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          GDACS
        </a>
        .
      </p>
    </section>
  );
}

function FeedHealth({
  feed,
  now,
  retrievalFailed,
}: {
  feed: FeedSnapshot;
  now: number;
  retrievalFailed: boolean;
}) {
  const age = feed.retrievedAt && now ? Math.max(0, now - Date.parse(feed.retrievedAt)) : null;
  const delayed = age !== null && age >= 900_000;
  const retained = feed.status === "retained" || (retrievalFailed && !!feed.retrievedAt);
  const status =
    feed.status === "unavailable" && !feed.retrievedAt
      ? "Unavailable"
      : retained
        ? "Previously loaded"
        : delayed
          ? "Refresh delayed"
          : "Retrieved";
  const diagnostic = feed.diagnostics;
  const incomplete =
    diagnostic.invalidRecords +
      diagnostic.missingLocations +
      diagnostic.conflictingLocations +
      diagnostic.omittedEvents >
      0 || diagnostic.limited;
  return (
    <details className="min-w-0 rounded-lg border px-3 py-2 text-xs">
      <summary className="min-h-8 cursor-pointer leading-relaxed">
        <span className="font-semibold">
          {feed.provider} {HAZARD_LABELS[feed.type].toLowerCase()}
        </span>
        <span
          className={cn(
            "ml-2",
            retained || delayed || status === "Unavailable"
              ? "text-caution"
              : "text-muted-foreground",
          )}
        >
          {status}
        </span>
        {delayed && retained && <span className="ml-1 text-caution"> / Refresh delayed</span>}
        {incomplete && <span className="ml-1 text-caution"> / limited coverage</span>}
      </summary>
      <div className="mt-2 space-y-2 border-t pt-2 leading-relaxed text-muted-foreground">
        <p>{feed.selection}</p>
        <p>
          Last successful retrieval:{" "}
          {feed.retrievedAt
            ? `${new Date(feed.retrievedAt).toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC`
            : "none"}
          {age !== null ? ` (${Math.floor(age / 60_000)} min ago)` : ""}.
        </p>
        {delayed && (
          <p className="text-caution">
            Refresh delayed: no successful retrieval in 15 minutes or more.
          </p>
        )}
        {feed.problem && <p>{feed.problem}</p>}
        {retained && (
          <p>Showing previously loaded reports. Retrieval time has not been advanced.</p>
        )}
        {feed.retryAfter && <p>Provider retry after: {feed.retryAfter}</p>}
        <p>
          {diagnostic.displayedCount} displayed / {diagnostic.availableCount} eligible source
          events. Ordering does not rank urgency.
        </p>
        {incomplete && (
          <p>
            Coverage diagnostics: {diagnostic.invalidRecords} invalid records,{" "}
            {diagnostic.missingLocations} missing locations, {diagnostic.conflictingLocations}{" "}
            conflicting locations, {diagnostic.omittedEvents} omitted events
            {diagnostic.limited ? "; response limit applied" : ""}.
          </p>
        )}
        <p>Successful retrieval is separate from the age of source observations.</p>
      </div>
    </details>
  );
}

function Results({
  events,
  total,
  loading,
  unavailable,
  mapUnavailable,
  enabledCount,
  onSelect,
  onWiden,
}: {
  events: HazardEvent[];
  total: number;
  loading: boolean;
  unavailable: boolean;
  mapUnavailable: boolean;
  enabledCount: number;
  onSelect: (id: string) => void;
  onWiden: () => void;
}) {
  return (
    <div>
      <div className="border-b px-5 py-4">
        <h2 tabIndex={-1} data-results-heading className="text-sm font-semibold">
          {mapUnavailable ? "Loaded reported locations" : "Reported locations in view"}{" "}
          <span className="ml-1 text-muted-foreground">{events.length}</span>
        </h2>
        <p className="mt-2 hidden text-xs leading-relaxed text-muted-foreground sm:block">
          {mapUnavailable
            ? "Map unavailable. Showing all loaded locations for the selected hazard types."
            : `${total} loaded locations match the selected hazard types. View membership follows reported points, not affected-country boundaries.`}
        </p>
      </div>
      {loading ? (
        <p role="status" className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
          Loading public hazard reports...
        </p>
      ) : events.length === 0 ? (
        <div role="status" className="space-y-3 p-5">
          <p className="font-medium">
            {unavailable
              ? "Source coverage unavailable"
              : enabledCount === 0
                ? "Choose a hazard type"
                : "No reported locations in this view"}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {unavailable
              ? "No usable feed snapshot is available. An unavailable source does not mean there are no hazards."
              : enabledCount === 0
                ? "Use the hazard controls to include reports in the map and list."
                : "The selected feeds may have no matching points here. This does not establish that the region is unaffected."}
          </p>
          {!unavailable && enabledCount > 0 && !mapUnavailable && (
            <Button variant="outline" onClick={onWiden} className="min-h-11">
              Explore World
              <ArrowRight />
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y" aria-label="Hazard reports">
          {events.map((event) => (
            <li key={event.id}>
              <button
                data-event-id={event.id}
                className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary focus-visible:relative focus-visible:z-10"
                onClick={() => onSelect(event.id)}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    SYMBOL_CLASSES[event.type],
                  )}
                >
                  {SYMBOLS[event.type]}
                </span>
                <span className="min-w-0">
                  <span className="text-xs text-muted-foreground">
                    {event.provider} / {HAZARD_LABELS[event.type]}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-snug">
                    {event.title}
                  </span>
                  <span className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block">
                    {event.location}
                  </span>
                  <span className="mt-2 block text-xs">
                    {event.type === "earthquake" && event.measurements.length
                      ? `${event.measurements[0].label}: ${event.measurements[0].value}`
                      : event.impact?.overall
                        ? `GDACS overall impact: ${event.impact.overall}`
                        : "Provider Representative Location"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
