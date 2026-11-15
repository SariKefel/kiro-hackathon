"use client";
import { useEffect, useSyncExternalStore } from "react";
import { dispatchContext } from "./data";
import { updateLocationAssignment } from "@/features/incidents/assignment-store";
import {
  emptyDispatchState,
  expireCalls,
  respondToCall,
  type DispatchState,
  type RejectReason,
} from "./logic";

// shortcut: dispatch state lives in localStorage and syncs across tabs on one device for the demo.
// Replace with the authenticated sync service and server pushes in Phase 2.
const KEY = "rescuesync.dispatch.v1";
const EVENT = "rescuesync-dispatch";
let cachedRaw: string | null = null;
let cachedState = emptyDispatchState;

function read(): DispatchState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      cachedState =
        Array.isArray(parsed?.calls) && Array.isArray(parsed?.injured)
          ? parsed
          : emptyDispatchState;
    } catch {
      cachedState = emptyDispatchState;
    }
  }
  return cachedState;
}

export function updateDispatch(change: (state: DispatchState) => DispatchState) {
  const current = read();
  const next = change(current);
  if (next === current) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** Answer a ringing call. An accepted call also places the responder on that site's shared assignment list. */
export function answerCall(
  input: { callId: string; responderId: string } & (
    { accept: true } | { accept: false; reason: RejectReason }
  ),
) {
  updateDispatch((s) => respondToCall(s, dispatchContext, { ...input, now: Date.now() }));
  const call = read().calls.find((c) => c.id === input.callId);
  if (input.accept && call?.state === "accepted")
    updateLocationAssignment(input.responderId, call.siteId);
}

export function resetDispatch() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** Current dispatch state, plus a one-second tick that expires unanswered calls. */
export function useDispatch() {
  const state = useSyncExternalStore(subscribe, read, () => emptyDispatchState);
  useEffect(() => {
    const id = setInterval(
      () => updateDispatch((s) => expireCalls(s, dispatchContext, Date.now())),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  return state;
}

export function useNow(intervalMs = 1000) {
  return useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, intervalMs);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => 0,
  );
}
