"use client";

import { useSyncExternalStore } from "react";
import { personnel } from "./demo-data";
import {
  initialLocationAssignments,
  isLocationId,
  type LocationAssignments,
} from "./response-locations";

const KEY = "rescuesync-demo-v1:location-assignments";
const listeners = new Set<() => void>();
let snapshot = initialLocationAssignments;
let hydrated = false;
let lastStoredRaw: string | null = null;

export function parseAssignments(raw: string | null): LocationAssignments {
  if (raw === null) return initialLocationAssignments;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return initialLocationAssignments;
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([id, location]) => personnel.some((person) => person.id === id) && isLocationId(location),
      ),
    );
  } catch {
    return initialLocationAssignments;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}
function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    lastStoredRaw = localStorage.getItem(KEY);
    snapshot = parseAssignments(lastStoredRaw);
  } catch {
    /* Keep demo defaults when storage is blocked. */
  }
}
function subscribe(listener: () => void) {
  hydrate();
  // Catch browser changes that arrived while no assignment view was mounted.
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== lastStoredRaw) {
      snapshot = parseAssignments(raw);
      lastStoredRaw = raw;
    }
  } catch {
    /* Keep session state when storage is blocked. */
  }
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) {
      try {
        lastStoredRaw = localStorage.getItem(KEY);
        snapshot = parseAssignments(lastStoredRaw);
        emit();
      } catch {
        /* Keep the current session. */
      }
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function updateLocationAssignment(userId: string, locationId: string | null) {
  hydrate();
  const person = personnel.find((person) => person.id === userId);
  if (!person || (locationId !== null && (!isLocationId(locationId) || person.status !== "safe")))
    return false;
  // Read the latest shared browser state before changing one responder.
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== lastStoredRaw) {
      snapshot = parseAssignments(raw);
      lastStoredRaw = raw;
    }
  } catch {
    /* Session-only mode. */
  }
  snapshot = { ...snapshot };
  if (locationId === null) delete snapshot[userId];
  else snapshot[userId] = locationId;
  let persisted = true;
  try {
    const raw = JSON.stringify(snapshot);
    localStorage.setItem(KEY, raw);
    lastStoredRaw = raw;
  } catch {
    persisted = false;
  }
  emit();
  return persisted;
}

export function useLocationAssignments() {
  return useSyncExternalStore(
    subscribe,
    () => {
      hydrate();
      return snapshot;
    },
    () => initialLocationAssignments,
  );
}
