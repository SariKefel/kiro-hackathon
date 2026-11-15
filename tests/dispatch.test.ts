import { describe, expect, test } from "bun:test";
import { dispatchContext as ctx, dispatchSites } from "../src/features/dispatch/data";
import {
  MAX_ATTEMPTS,
  RING_MS,
  distanceKm,
  emptyDispatchState,
  expireCalls,
  rankCandidates,
  respondToCall,
  ringingAttempt,
  setCallState,
  startCall,
} from "../src/features/dispatch/logic";

const plumbum = dispatchSites[0];
const amir = "demo-user-1";
const nur = "demo-user-10";
const start = (now = 0, responderId?: string) =>
  startCall(emptyDispatchState, ctx, { id: "call-1", siteId: plumbum.id, now, responderId });
const ringingId = (s: typeof emptyDispatchState) => ringingAttempt(s.calls[0])?.responderId;

describe("proximity ranking", () => {
  test("haversine distance is roughly right", () => {
    // One degree of latitude is about 111 km.
    expect(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 })).toBeCloseTo(
      111.2,
      0,
    );
  });
  test("puts the nearest fresh, available responder first", () => {
    const ranked = rankCandidates(plumbum, emptyDispatchState, ctx);
    expect(ranked[0].person.id).toBe(amir);
    expect(ranked[1].person.id).toBe(nur);
    const ids = ranked.map((c) => c.person.id);
    // Hakim is closest but stale, Jason has no location, Ravi needs help.
    expect(ids.indexOf("demo-user-9")).toBeGreaterThan(ids.indexOf("demo-user-8"));
    expect(ids.indexOf("demo-user-7")).toBeGreaterThan(ids.indexOf("demo-user-9"));
    const ravi = ranked.find((c) => c.person.id === "demo-user-3")!;
    expect(ravi.available).toBe(false);
    expect(ids.indexOf("demo-user-3")).toBeGreaterThan(ids.indexOf("demo-user-7"));
  });
});

describe("call chain", () => {
  test("auto-dispatch rings the nearest available responder", () => {
    expect(ringingId(start())).toBe(amir);
  });
  test("ignores a second open call for the same site", () => {
    const s = start();
    expect(startCall(s, ctx, { id: "call-2", siteId: plumbum.id, now: 1 })).toBe(s);
  });
  test("refuses a manual pick of an unavailable responder", () => {
    expect(start(0, "demo-user-3")).toBe(emptyDispatchState);
  });
  test("accepting assigns the call and makes the responder busy elsewhere", () => {
    const s = respondToCall(start(), ctx, {
      callId: "call-1",
      responderId: amir,
      now: 5,
      accept: true,
    });
    expect(s.calls[0].state).toBe("accepted");
    const other = rankCandidates(dispatchSites[1], s, ctx).find((c) => c.person.id === amir)!;
    expect(other.unavailableReason).toBe("On another dispatch");
  });
  test("rejecting passes the call to the next nearest", () => {
    const s = respondToCall(start(), ctx, {
      callId: "call-1",
      responderId: amir,
      now: 5,
      accept: false,
      reason: "too_far",
    });
    expect(s.calls[0].attempts[0]).toMatchObject({ outcome: "rejected", reason: "too_far" });
    expect(ringingId(s)).toBe(nur);
  });
  test("an injured rejection marks the responder as needing assistance", () => {
    const s = respondToCall(start(), ctx, {
      callId: "call-1",
      responderId: amir,
      now: 5,
      accept: false,
      reason: "injured",
    });
    expect(s.injured).toEqual([amir]);
  });
  test("an unsafe rejection raises a hazard on the call", () => {
    const s = respondToCall(start(), ctx, {
      callId: "call-1",
      responderId: amir,
      now: 5,
      accept: false,
      reason: "unsafe",
    });
    expect(s.calls[0].hazards).toEqual([amir]);
  });
  test("only the ringing responder can answer", () => {
    const s = start();
    expect(
      respondToCall(s, ctx, { callId: "call-1", responderId: nur, now: 5, accept: true }),
    ).toBe(s);
  });
  test("an unanswered call is missed and moves on", () => {
    const s = start();
    expect(expireCalls(s, ctx, RING_MS - 1)).toBe(s);
    const next = expireCalls(s, ctx, RING_MS);
    expect(next.calls[0].attempts[0].outcome).toBe("missed");
    expect(ringingId(next)).toBe(nur);
  });
  test("stops after the attempt cap and flags the site unassigned", () => {
    let s = start();
    for (let i = 1; i <= MAX_ATTEMPTS; i++) s = expireCalls(s, ctx, i * RING_MS);
    expect(s.calls[0].attempts).toHaveLength(MAX_ATTEMPTS);
    expect(s.calls[0].state).toBe("unassigned");
  });
  test("progress moves forward only", () => {
    let s = respondToCall(start(), ctx, {
      callId: "call-1",
      responderId: amir,
      now: 5,
      accept: true,
    });
    s = setCallState(s, "call-1", "en_route");
    s = setCallState(s, "call-1", "arrived");
    expect(s.calls[0].state).toBe("arrived");
    expect(setCallState(s, "call-1", "en_route")).toBe(s);
  });
});
