import type { Personnel } from "@/types/domain";

export const RING_MS = 30_000;
export const MAX_ATTEMPTS = 4;
export const STALE_MS = 30 * 60_000;

export interface DispatchSite {
  id: string;
  name: string;
  need: string;
  priority: "critical" | "high" | "normal";
  latitude: number;
  longitude: number;
}
export interface ResponderPosition {
  userId: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
}
export const rejectReasons = {
  on_task: { label: "On another task", passOn: "Busy" },
  too_far: { label: "Too far away", passOn: "Too far" },
  unsafe: { label: "Unsafe where I am", passOn: "Hazard reported" },
  injured: { label: "Injured or need help", passOn: "Needs assistance" },
  no_equipment: { label: "Out of equipment", passOn: "No equipment" },
  off_duty: { label: "Resting or off duty", passOn: "Off duty" },
} as const;
export type RejectReason = keyof typeof rejectReasons;

export interface CallAttempt {
  responderId: string;
  startedAt: number;
  outcome: "ringing" | "accepted" | "rejected" | "missed";
  reason?: RejectReason;
  endedAt?: number;
}
export type CallState =
  "calling" | "accepted" | "en_route" | "arrived" | "unassigned" | "cancelled";
export interface DispatchCall {
  id: string;
  siteId: string;
  state: CallState;
  attempts: CallAttempt[];
  hazards: string[];
}
export interface DispatchState {
  calls: DispatchCall[];
  injured: string[];
}
export interface DispatchContext {
  sites: DispatchSite[];
  people: Personnel[];
  positions: ResponderPosition[];
  snapshotMs: number;
}
export interface Candidate {
  person: Personnel;
  distanceKm: number | null;
  etaMinutes: number | null;
  stale: boolean;
  available: boolean;
  unavailableReason?: string;
}

export const emptyDispatchState: DispatchState = { calls: [], injured: [] };
const openStates: CallState[] = ["calling", "accepted", "en_route", "arrived"];

export function distanceKm(a: { latitude: number; longitude: number }, b: typeof a) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// shortcut: straight line x1.4 road factor at 25 km/h flood speed, replace with a routing API for real ETAs.
export function etaMinutes(km: number) {
  return Math.max(1, Math.ceil(((km * 1.4) / 25) * 60));
}

export function mapsDirectionsUrl(site: DispatchSite) {
  return `https://www.google.com/maps/dir/?api=1&destination=${site.latitude},${site.longitude}&travelmode=driving`;
}

export function rankCandidates(
  site: DispatchSite,
  state: DispatchState,
  ctx: DispatchContext,
  call?: DispatchCall,
): Candidate[] {
  const busy = new Set(
    state.calls
      .filter((c) => c.id !== call?.id && openStates.includes(c.state))
      .map((c) => c.attempts.at(-1)?.responderId),
  );
  const tried = new Set(call?.attempts.map((a) => a.responderId));
  const candidates = ctx.people.map((person): Candidate => {
    const position = ctx.positions.find((p) => p.userId === person.id);
    const km = position ? distanceKm(position, site) : null;
    const reason =
      person.status === "needs_help" ||
      person.status === "unable_to_continue" ||
      state.injured.includes(person.id)
        ? "Needs assistance"
        : busy.has(person.id)
          ? "On another dispatch"
          : tried.has(person.id)
            ? "Already called"
            : undefined;
    return {
      person,
      distanceKm: km,
      etaMinutes: km === null ? null : etaMinutes(km),
      stale: !position || ctx.snapshotMs - Date.parse(position.capturedAt) > STALE_MS,
      available: !reason,
      unavailableReason: reason,
    };
  });
  // Available first, then fresh locations, then nearest. Unknown locations sort last in each group.
  const tier = (c: Candidate) =>
    (c.available ? 0 : 3) + (c.distanceKm === null ? 2 : c.stale ? 1 : 0);
  return candidates.sort(
    (a, b) => tier(a) - tier(b) || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
  );
}

function ringNext(call: DispatchCall, state: DispatchState, ctx: DispatchContext, now: number) {
  const site = ctx.sites.find((s) => s.id === call.siteId)!;
  const next =
    call.attempts.length < MAX_ATTEMPTS
      ? rankCandidates(site, state, ctx, call).find((c) => c.available)
      : undefined;
  return next
    ? {
        ...call,
        state: "calling" as const,
        attempts: [
          ...call.attempts,
          { responderId: next.person.id, startedAt: now, outcome: "ringing" as const },
        ],
      }
    : { ...call, state: "unassigned" as const };
}

function replaceCall(state: DispatchState, call: DispatchCall): DispatchState {
  return { ...state, calls: state.calls.map((c) => (c.id === call.id ? call : c)) };
}

export function startCall(
  state: DispatchState,
  ctx: DispatchContext,
  input: { id: string; siteId: string; responderId?: string; now: number },
): DispatchState {
  if (state.calls.some((c) => c.siteId === input.siteId && openStates.includes(c.state)))
    return state;
  const site = ctx.sites.find((s) => s.id === input.siteId);
  if (!site) return state;
  const blank: DispatchCall = {
    id: input.id,
    siteId: site.id,
    state: "calling",
    attempts: [],
    hazards: [],
  };
  const chosen = input.responderId
    ? rankCandidates(site, state, ctx).find((c) => c.person.id === input.responderId && c.available)
    : undefined;
  if (input.responderId && !chosen) return state;
  const call = chosen
    ? {
        ...blank,
        attempts: [
          { responderId: chosen.person.id, startedAt: input.now, outcome: "ringing" as const },
        ],
      }
    : ringNext(blank, state, ctx, input.now);
  return { ...state, calls: [...state.calls, call] };
}

export function ringingAttempt(call: DispatchCall) {
  const last = call.attempts.at(-1);
  return call.state === "calling" && last?.outcome === "ringing" ? last : undefined;
}

export function respondToCall(
  state: DispatchState,
  ctx: DispatchContext,
  input: { callId: string; responderId: string; now: number } & (
    { accept: true } | { accept: false; reason: RejectReason }
  ),
): DispatchState {
  const call = state.calls.find((c) => c.id === input.callId);
  const ringing = call && ringingAttempt(call);
  if (!call || ringing?.responderId !== input.responderId) return state;
  const ended: CallAttempt = input.accept
    ? { ...ringing, outcome: "accepted", endedAt: input.now }
    : { ...ringing, outcome: "rejected", reason: input.reason, endedAt: input.now };
  const updated: DispatchCall = {
    ...call,
    state: input.accept ? "accepted" : call.state,
    attempts: [...call.attempts.slice(0, -1), ended],
    hazards:
      !input.accept && input.reason === "unsafe"
        ? [...call.hazards, input.responderId]
        : call.hazards,
  };
  if (input.accept) return replaceCall(state, updated);
  const next: DispatchState =
    input.reason === "injured"
      ? { ...state, injured: [...state.injured, input.responderId] }
      : state;
  return replaceCall(next, ringNext(updated, next, ctx, input.now));
}

export function expireCalls(
  state: DispatchState,
  ctx: DispatchContext,
  now: number,
): DispatchState {
  let next = state;
  for (const call of state.calls) {
    const ringing = ringingAttempt(call);
    if (!ringing || now - ringing.startedAt < RING_MS) continue;
    const missed: DispatchCall = {
      ...call,
      attempts: [...call.attempts.slice(0, -1), { ...ringing, outcome: "missed", endedAt: now }],
    };
    next = replaceCall(next, ringNext(missed, next, ctx, now));
  }
  return next;
}

export function setCallState(
  state: DispatchState,
  callId: string,
  to: "en_route" | "arrived" | "cancelled",
): DispatchState {
  const call = state.calls.find((c) => c.id === callId);
  const allowed = {
    en_route: ["accepted"],
    arrived: ["accepted", "en_route"],
    cancelled: ["calling", "accepted", "en_route", "arrived", "unassigned"],
  }[to];
  return call && allowed.includes(call.state) ? replaceCall(state, { ...call, state: to }) : state;
}

/** Seconds left to answer. Clamped because the UI clock is rounded down to the tick. */
export function secondsLeft(attempt: CallAttempt, now: number) {
  return Math.min(
    RING_MS / 1000,
    Math.max(0, Math.ceil((attempt.startedAt + RING_MS - now) / 1000)),
  );
}
