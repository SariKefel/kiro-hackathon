"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { MapPinOff, RotateCcw } from "lucide-react";
import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import type { FeatureCollection, Point } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import type { CameraRequest, HazardEvent, ViewportBounds } from "./types";
import { REGION_BOUNDS } from "./map/regions";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const SOURCE_ID = "external-hazards";
const SELECTED_SOURCE_ID = "selected-external-hazard";
const LIGHT_STYLE = "mapbox://styles/mapbox/light-v11";
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

type MapStatus = "loading" | "ready" | "unavailable";

export interface HazardMapProps {
  /** Already filtered by enabled hazard types, before Mapbox builds its clusters. */
  events: HazardEvent[];
  selectedId: string | null;
  cameraRequest: CameraRequest | null;
  onSelect: (id: string) => void;
  onViewportChange: (bounds: ViewportBounds | null) => void;
  onStatusChange?: (status: MapStatus) => void;
}

function collection(events: HazardEvent[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: events.map((event) => ({
      type: "Feature",
      id: event.id,
      geometry: { type: "Point", coordinates: event.coordinates },
      properties: { eventId: event.id, hazardType: event.type },
    })),
  };
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function navigate(map: MapboxMap, request: CameraRequest) {
  const duration = reducedMotion() ? 0 : 550;
  if (request.coordinates) {
    const bounds = map.getBounds();
    // List selection only moves the camera if the reported location is outside the view.
    if (!bounds?.contains(request.coordinates)) {
      map.easeTo({ center: request.coordinates, zoom: Math.max(map.getZoom(), 5), duration });
    }
  } else if (request.preset) {
    const { west, south, east, north } = REGION_BOUNDS[request.preset];
    map.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      { padding: 32, duration, maxZoom: 7 },
    );
  }
}

function addHazardLayers(map: MapboxMap, events: HazardEvent[], selectedId: string | null) {
  map.addSource(SOURCE_ID, {
    type: "geojson",
    data: collection(events),
    cluster: true,
    clusterRadius: 44,
    clusterMaxZoom: 12,
  });
  map.addLayer({
    id: "hazard-clusters",
    type: "circle",
    source: SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#254244",
      "circle-radius": ["step", ["get", "point_count"], 19, 10, 23, 50, 28],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  });
  map.addLayer({
    id: "hazard-cluster-counts",
    type: "symbol",
    source: SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#ffffff" },
  });
  map.addLayer({
    id: "hazard-points",
    type: "circle",
    source: SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": [
        "match",
        ["get", "hazardType"],
        "earthquake",
        "#b45309",
        "flood",
        "#0369a1",
        "cyclone",
        "#7e22ce",
        "#254244",
      ],
      "circle-radius": 13,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  });
  map.addLayer({
    id: "hazard-point-labels",
    type: "symbol",
    source: SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": [
        "match",
        ["get", "hazardType"],
        "earthquake",
        "E",
        "flood",
        "F",
        "cyclone",
        "C",
        "?",
      ],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 11,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": "#ffffff" },
  });
  map.addSource(SELECTED_SOURCE_ID, {
    type: "geojson",
    data: collection(events.filter((event) => event.id === selectedId)),
  });
  map.addLayer({
    id: "selected-hazard-ring",
    type: "circle",
    source: SELECTED_SOURCE_ID,
    paint: {
      "circle-radius": 19,
      "circle-color": "#087f72",
      "circle-opacity": 0.12,
      "circle-stroke-color": "#087f72",
      "circle-stroke-width": 3,
    },
  });
}

/** Geographic canvas only. Provider retrieval and inspection state belong to the explorer. */
export function HazardMap({
  events,
  selectedId,
  cameraRequest,
  onSelect,
  onViewportChange,
  onStatusChange,
}: HazardMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const eventsRef = useRef(events);
  const selectedRef = useRef(selectedId);
  const cameraRef = useRef(cameraRequest);
  const lastCameraSequence = useRef<number | null>(null);
  const previousView = useRef<{ center: [number, number]; zoom: number } | null>(null);
  const callbacks = useRef({ onSelect, onViewportChange, onStatusChange });
  const { resolvedTheme } = useTheme();
  const themeRef = useRef(resolvedTheme);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<MapStatus>(
    TOKEN?.startsWith("pk.") ? "loading" : "unavailable",
  );

  useEffect(() => {
    callbacks.current = { onSelect, onViewportChange, onStatusChange };
  }, [onSelect, onViewportChange, onStatusChange]);

  useEffect(() => {
    eventsRef.current = events;
    const map = mapRef.current;
    (map?.getSource(SOURCE_ID) as GeoJSONSource | undefined)?.setData(collection(events));
    (map?.getSource(SELECTED_SOURCE_ID) as GeoJSONSource | undefined)?.setData(
      collection(events.filter((event) => event.id === selectedRef.current)),
    );
  }, [events]);

  useEffect(() => {
    selectedRef.current = selectedId;
    const source = mapRef.current?.getSource(SELECTED_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(collection(eventsRef.current.filter((event) => event.id === selectedId)));
  }, [selectedId]);

  useEffect(() => {
    cameraRef.current = cameraRequest;
    if (
      cameraRequest &&
      cameraRequest.sequence !== lastCameraSequence.current &&
      mapRef.current?.getSource(SOURCE_ID)
    ) {
      navigate(mapRef.current, cameraRequest);
      lastCameraSequence.current = cameraRequest.sequence;
    }
  }, [cameraRequest]);

  useEffect(() => {
    themeRef.current = resolvedTheme;
    const map = mapRef.current;
    if (map) map.setStyle(resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE);
  }, [resolvedTheme]);

  useEffect(() => {
    if (!TOKEN?.startsWith("pk.")) {
      callbacks.current.onStatusChange?.("unavailable");
      callbacks.current.onViewportChange(null);
      return;
    }
    let disposed = false;
    let failed = false;
    let map: MapboxMap | null = null;
    let observer: ResizeObserver | undefined;
    const updateStatus = (next: MapStatus) => {
      if (!disposed) {
        setStatus(next);
        callbacks.current.onStatusChange?.(next);
      }
    };
    const fail = () => {
      if (disposed || failed) return;
      failed = true;
      updateStatus("unavailable");
      callbacks.current.onViewportChange(null);
    };
    const loadTimeout = window.setTimeout(fail, 20_000);
    const publishBounds = () => {
      if (!map || disposed || failed) return;
      const bounds = map.getBounds();
      const center = map.getCenter();
      previousView.current = { center: [center.lng, center.lat], zoom: map.getZoom() };
      if (bounds) {
        callbacks.current.onViewportChange({
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        });
      }
    };

    void import("mapbox-gl")
      .then(({ default: mapboxgl }) => {
        if (disposed || failed || !container.current) return;
        if (!mapboxgl.supported()) {
          fail();
          return;
        }
        map = new mapboxgl.Map({
          container: container.current,
          accessToken: TOKEN,
          style: themeRef.current === "dark" ? DARK_STYLE : LIGHT_STYLE,
          ...(previousView.current ?? {
            center: [116, 8] as [number, number],
            zoom: 3,
            bounds: [
              [90, -12],
              [142, 28],
            ] as [[number, number], [number, number]],
            fitBoundsOptions: { padding: 32 },
          }),
          attributionControl: false,
          maxZoom: 15,
          minZoom: 0,
          renderWorldCopies: true,
          projection: { name: "mercator" },
          // View membership uses rectangular bounds, so keep the geographic canvas north-up and flat.
          bearing: 0,
          pitch: 0,
          maxPitch: 0,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
        });
        mapRef.current = map;
        map.keyboard.disableRotation();
        map.touchZoomRotate.disableRotation();
        map
          .getCanvas()
          .setAttribute(
            "aria-label",
            "External hazard map. Use results for keyboard access to every reported location.",
          );
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new mapboxgl.AttributionControl(), "bottom-right");
        map.on("style.load", () => {
          if (!map || disposed || failed) return;
          try {
            map.setProjection({ name: "mercator" });
            addHazardLayers(map, eventsRef.current, selectedRef.current);
            window.clearTimeout(loadTimeout);
            updateStatus("ready");
            if (cameraRef.current && cameraRef.current.sequence !== lastCameraSequence.current) {
              navigate(map, cameraRef.current);
              lastCameraSequence.current = cameraRef.current.sequence;
            }
            publishBounds();
          } catch {
            fail();
          }
        });
        map.on("moveend", publishBounds);
        map.on("error", fail);
        map.on("webglcontextlost", fail);
        map.on("click", "hazard-points", (event) => {
          const id = event.features?.[0]?.properties?.eventId;
          if (typeof id === "string") callbacks.current.onSelect(id);
        });
        map.on("click", "hazard-clusters", (event) => {
          const feature = event.features?.[0];
          if (!map || feature?.geometry.type !== "Point") return;
          const clusterId = feature.properties?.cluster_id;
          if (typeof clusterId !== "number") return;
          const coordinates = feature.geometry.coordinates as [number, number];
          const source = map.getSource(SOURCE_ID) as GeoJSONSource;
          source.getClusterExpansionZoom(clusterId, (error, zoom) => {
            if (error || zoom == null || !map || disposed || failed) return;
            map.easeTo({ center: coordinates, zoom, duration: reducedMotion() ? 0 : 450 });
          });
        });
        for (const layer of ["hazard-clusters", "hazard-points"]) {
          map.on("mouseenter", layer, () => {
            if (map) map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layer, () => {
            if (map) map.getCanvas().style.cursor = "";
          });
        }
        observer = new ResizeObserver(() => map?.resize());
        observer.observe(container.current);
      })
      .catch(fail);

    return () => {
      disposed = true;
      window.clearTimeout(loadTimeout);
      observer?.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  }, [attempt]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-secondary">
      <div
        ref={container}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      {status === "loading" && (
        <p
          role="status"
          className="absolute left-4 top-4 rounded-lg border bg-card px-3 py-2 text-xs shadow-sm"
        >
          Loading geographic context…
        </p>
      )}
      {status === "unavailable" && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary px-6 py-10">
          <div className="max-w-xs text-center">
            <MapPinOff className="mx-auto mb-4 size-8 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-base font-semibold">Map unavailable</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {TOKEN?.startsWith("pk.")
                ? "The basemap could not load. Use results to inspect reports and open their original sources."
                : "The basemap needs a public Mapbox token. Results, filters, and original reports remain available."}
            </p>
            {TOKEN?.startsWith("pk.") && (
              <button
                type="button"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium hover:bg-background"
                onClick={() => {
                  setStatus("loading");
                  setAttempt((value) => value + 1);
                }}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Retry map
              </button>
            )}
            <p className="mt-6 text-xs text-muted-foreground">Hazard reports: USGS and GDACS</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HazardMap;
