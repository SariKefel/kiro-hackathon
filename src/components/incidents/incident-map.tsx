"use client";

import { useState } from "react";
import { Check, MapPin, Search, Users, X } from "lucide-react";
import { GeographicMap } from "@/components/maps/geographic-map";
import { personnel } from "@/features/incidents/demo-data";
import { responseLocations } from "@/features/incidents/response-locations";
import {
  updateLocationAssignment,
  useLocationAssignments,
} from "@/features/incidents/assignment-store";
import { StatusBadge } from "@/components/shared/status-badge";
import { initials } from "@/lib/utils";
import type { CameraRequest } from "@/features/hazards/types";

const BOUNDS: [[number, number], [number, number]] = [
  [101.472, 3.056],
  [101.509, 3.085],
];
const ignoreViewport = () => {};

export function IncidentMap({
  large = false,
  preview = false,
}: {
  large?: boolean;
  preview?: boolean;
}) {
  const assignments = useLocationAssignments();
  const [selected, setSelected] = useState(responseLocations[0].id);
  const [camera, setCamera] = useState<CameraRequest | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const location = responseLocations.find((place) => place.id === selected)!;
  const assigned = personnel.filter((person) => assignments[person.id] === selected);
  const candidates = personnel.filter(
    (person) =>
      assignments[person.id] !== selected &&
      `${person.name} ${person.team} ${person.role}`.toLowerCase().includes(search.toLowerCase()),
  );
  function select(id: string) {
    const place = responseLocations.find((place) => place.id === id);
    if (!place) return;
    setSelected(id);
    setCamera((previous) => ({
      sequence: (previous?.sequence ?? 0) + 1,
      coordinates: place.coordinates,
    }));
    setEditing(false);
    setSearch("");
    setMessage("");
  }
  function assign(id: string, target: string | null) {
    const persisted = updateLocationAssignment(id, target);
    const person = personnel.find((person) => person.id === id)!;
    setMessage(
      `${person.name} ${target ? "assigned to " + location.shortName : "removed from " + location.shortName}. ${persisted ? "Saved in this browser." : "Kept for this session only; browser storage is unavailable."}`,
    );
  }
  return (
    <section
      className="response-map overflow-hidden rounded-xl border bg-card"
      aria-label={preview ? "Sample response locations" : "Demo response locations and assignments"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <MapPin className="size-4 text-primary" />
          Response locations
        </span>
        <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
          Demo assignments
        </span>
      </div>
      <div className={preview ? "" : "response-map-layout"}>
        <div
          data-tour="response-map"
          className={`${preview ? "h-[260px] sm:h-[320px]" : `response-map-canvas ${large ? "h-[380px]" : "h-[300px]"}`} relative`}
        >
          <GeographicMap
            events={responseLocations.map((place) => ({
              id: place.id,
              coordinates: place.coordinates,
              type: "response",
              title: place.shortName,
              label: String(Object.values(assignments).filter((id) => id === place.id).length),
            }))}
            selectedId={selected}
            cameraRequest={camera}
            onSelect={select}
            onViewportChange={ignoreViewport}
            initialBounds={BOUNDS}
            ariaLabel={
              preview
                ? "Shah Alam sample response locations. Use the buttons below to inspect each location."
                : "Shah Alam demo response locations. Select a location below to manage responders."
            }
          />
          <div className="pointer-events-none absolute bottom-7 left-3 rounded-md border bg-card/95 px-2 py-1 text-xs text-muted-foreground">
            Marker numbers show assigned responders
          </div>
        </div>
        <div className={preview ? "" : "response-map-details"}>
          <div
            className="grid grid-cols-3 border-y"
            role="group"
            data-tour="response-locations"
            aria-label="Select response location"
          >
            {responseLocations.map((place) => {
              const count = Object.values(assignments).filter((id) => id === place.id).length;
              return (
                <button
                  key={place.id}
                  type="button"
                  aria-pressed={selected === place.id}
                  onClick={() => select(place.id)}
                  className={`min-h-16 border-b-2 px-2 py-3 text-left text-sm transition-colors sm:px-4 ${selected === place.id ? "border-signal bg-signal-soft text-signal-text" : "border-transparent text-muted-foreground hover:bg-secondary"}`}
                >
                  <span className="block font-semibold">{place.shortName}</span>
                  <span className="mt-1 block text-xs">{count} assigned</span>
                </button>
              );
            })}
          </div>
          {preview ? (
            <p className="px-4 py-3 text-xs leading-5 text-muted-foreground">
              {location.name}. Sample response locations for this demo.
            </p>
          ) : (
            <div className="p-4">
              <p className="text-xs text-muted-foreground">{location.kind}</p>
              <h3 className="mt-1 text-sm font-semibold">{location.name}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{location.description}</p>
              <div className="mb-3 mt-4 flex flex-wrap items-center justify-between gap-2">
                <h4 className="flex items-center gap-2 text-xs font-semibold">
                  <Users className="size-3.5" />
                  Assigned responders ({assigned.length})
                </h4>
                <button
                  type="button"
                  data-tour="assign-responders"
                  aria-expanded={editing}
                  onClick={() => setEditing(!editing)}
                  className="min-h-10 rounded-lg border px-3 text-xs font-medium hover:bg-secondary"
                >
                  {editing ? "Done" : "Assign responders"}
                </button>
              </div>
              {assigned.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
                  No responders assigned. Choose Assign responders to staff this location.
                </p>
              )}
              <ul data-tour="response-roster" className="min-h-12 divide-y">
                {assigned.map((person) => (
                  <li key={person.id} className="flex items-center gap-2 py-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-signal-text">
                      {initials(person.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium">{person.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {person.team}, {person.role}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${person.name} from ${location.shortName}`}
                      onClick={() => assign(person.id, null)}
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              {editing && (
                <div className="mt-3 rounded-lg border bg-secondary/30 p-3">
                  <label className="relative block">
                    <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="field pl-9"
                      placeholder="Search responders or teams"
                      aria-label="Search responders to assign"
                    />
                  </label>
                  <p className="my-3 text-xs leading-5 text-muted-foreground">
                    Assigning someone moves their current location assignment. Only responders with
                    a Safe report can be assigned in this demo.
                  </p>
                  <ul className="max-h-64 overflow-y-auto divide-y">
                    {candidates.map((person) => {
                      const current = responseLocations.find(
                        (place) => place.id === assignments[person.id],
                      );
                      return (
                        <li
                          key={person.id}
                          className="flex items-center justify-between gap-2 py-3"
                        >
                          <span className="min-w-0">
                            <span className="block text-xs font-medium">{person.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {person.team}, {current?.shortName ?? "Unassigned"}
                            </span>
                            <StatusBadge status={person.status} />
                          </span>
                          <button
                            type="button"
                            disabled={person.status !== "safe"}
                            onClick={() => assign(person.id, selected)}
                            className="min-h-10 shrink-0 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`${current ? "Move" : "Assign"} ${person.name} to ${location.shortName}`}
                          >
                            {current ? "Move here" : "Assign"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {candidates.length === 0 && (
                    <p className="py-4 text-xs text-muted-foreground">
                      No matching responders. Try another name or team.
                    </p>
                  )}
                </div>
              )}
              <p role="status" className="mt-3 flex items-start gap-1 text-xs text-signal-text">
                {message && (
                  <>
                    <Check className="mt-0.5 size-3 shrink-0" />
                    {message}
                  </>
                )}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Illustrative response positions, not verified field locations. Assignments are local
                to this browser and are not sent to responders.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
