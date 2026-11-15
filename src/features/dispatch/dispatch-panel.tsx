"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CircleAlert,
  ExternalLink,
  MapPin,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  RotateCcw,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { demoResponder } from "@/features/incidents/demo-data";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { dispatchContext, dispatchSites } from "./data";
import {
  secondsLeft,
  rankCandidates,
  rejectReasons,
  respondToCall,
  ringingAttempt,
  setCallState,
  startCall,
  type DispatchCall,
  type RejectReason,
} from "./logic";
import { resetDispatch, updateDispatch, useDispatch, useNow } from "./store";

const stateLabels: Record<DispatchCall["state"], string> = {
  calling: "Calling",
  accepted: "Accepted",
  en_route: "En route",
  arrived: "Arrived on site",
  unassigned: "Unassigned, needs commander",
  cancelled: "Closed",
};
const priorityStyles = {
  critical: "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300",
  high: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  normal: "bg-muted text-muted-foreground",
};
const nameOf = (id: string) => dispatchContext.people.find((p) => p.id === id)?.name ?? id;

function minutesAgo(iso: string | undefined) {
  if (!iso) return "No location shared";
  const mins = Math.round((dispatchContext.snapshotMs - Date.parse(iso)) / 60_000);
  return mins < 60 ? `Location ${mins} min ago` : `Location ${Math.round(mins / 60)} h ago`;
}

export function DispatchPanel() {
  const state = useDispatch();
  const now = useNow();
  const [siteId, setSiteId] = useState(dispatchSites[0].id);
  const site = dispatchSites.find((s) => s.id === siteId)!;
  const call = state.calls.findLast((c) => c.siteId === siteId && c.state !== "cancelled");
  const ranked = rankCandidates(
    site,
    state,
    dispatchContext,
    call?.state === "calling" ? call : undefined,
  );
  const open = call && call.state !== "unassigned";
  const dial = (responderId?: string) =>
    updateDispatch((s) =>
      startCall(s, dispatchContext, {
        id: crypto.randomUUID(),
        siteId,
        responderId,
        now: Date.now(),
      }),
    );

  return (
    <section className="panel p-6" aria-labelledby="dispatch-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="dispatch-heading" className="section-heading flex items-center gap-2">
            <PhoneCall className="size-4 text-muted-foreground" />
            Proximity dispatch
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Calls the nearest available responder. A rejection or missed call passes to the next
            nearest.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/responder" target="_blank">
              <ExternalLink />
              Open responder view
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={resetDispatch}>
            <RotateCcw />
            Reset demo
          </Button>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-xs font-medium">Site needing a responder</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {dispatchSites.map((s) => {
            const siteCall = state.calls.findLast(
              (c) => c.siteId === s.id && c.state !== "cancelled",
            );
            return (
              <label
                key={s.id}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 text-left has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                  s.id === siteId && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  name="dispatch-site"
                  value={s.id}
                  checked={s.id === siteId}
                  onChange={() => setSiteId(s.id)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
                    priorityStyles[s.priority],
                  )}
                >
                  {s.priority}
                </span>
                <span className="mt-2 block text-sm font-semibold">{s.name}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {siteCall ? stateLabels[siteCall.state] : "No responder"}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
        <MapPin className="mt-0.5 size-3.5 shrink-0" />
        {site.need}
      </p>

      {call ? <CallTimeline call={call} now={now} /> : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-semibold">Responders by distance</h3>
        <Button onClick={() => dial()} disabled={open}>
          <Zap />
          Auto-dispatch nearest
        </Button>
      </div>
      <ol className="mt-3 divide-y rounded-lg border">
        {ranked.map((c, index) => {
          const position = dispatchContext.positions.find((p) => p.userId === c.person.id);
          const recommended = index === 0 && c.available && !c.stale;
          return (
            <li
              key={c.person.id}
              className={cn(
                "flex flex-wrap items-center gap-3 px-4 py-3",
                !c.available && "opacity-60",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {c.person.name}
                  {recommended ? (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary dark:text-teal-300">
                      Recommended
                    </span>
                  ) : null}
                  {c.stale && position ? (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Stale location
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {c.person.team} · {c.person.role} · {minutesAgo(position?.capturedAt)}
                </p>
              </div>
              <div className="text-right text-xs tabular-nums">
                {c.distanceKm === null ? (
                  <span className="text-muted-foreground">Location unknown</span>
                ) : (
                  <>
                    <span className="font-semibold">{c.distanceKm.toFixed(1)} km</span>
                    <span className="block text-[11px] text-muted-foreground">
                      ~{c.etaMinutes} min est.
                    </span>
                  </>
                )}
              </div>
              <StatusBadge
                status={state.injured.includes(c.person.id) ? "needs_help" : c.person.status}
              />
              {c.available ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => dial(c.person.id)}
                  disabled={open}
                >
                  <PhoneCall />
                  Call
                </Button>
              ) : (
                <span className="w-28 text-right text-[11px] text-muted-foreground">
                  {c.unavailableReason}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
        Sample positions and straight-line distances. Travel times are estimates, not road routes.
        Calls sync between tabs on this device only.
      </p>
    </section>
  );
}

function CallTimeline({ call, now }: { call: DispatchCall; now: number }) {
  const ringing = ringingAttempt(call);
  const seconds = ringing ? secondsLeft(ringing, now) : 0;
  const simulate = (accept: boolean, reason: RejectReason = "too_far") =>
    ringing &&
    updateDispatch((s) =>
      respondToCall(
        s,
        dispatchContext,
        accept
          ? { callId: call.id, responderId: ringing.responderId, now: Date.now(), accept: true }
          : {
              callId: call.id,
              responderId: ringing.responderId,
              now: Date.now(),
              accept: false,
              reason,
            },
      ),
    );
  return (
    <div className="mt-5 rounded-lg border bg-muted/40 p-4" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{stateLabels[call.state]}</p>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => updateDispatch((s) => setCallState(s, call.id, "cancelled"))}
        >
          <PhoneOff />
          {call.state === "arrived"
            ? "Close"
            : call.state === "unassigned"
              ? "Dismiss"
              : "Cancel dispatch"}
        </Button>
      </div>
      <ol className="mt-3 space-y-2 text-xs">
        {call.attempts.map((a, i) => (
          <li key={i} className="flex items-center gap-2">
            {a.outcome === "ringing" ? (
              <PhoneCall className="size-3.5 animate-pulse text-primary" />
            ) : a.outcome === "accepted" ? (
              <PhoneCall className="size-3.5 text-emerald-700 dark:text-emerald-300" />
            ) : (
              <PhoneMissed className="size-3.5 text-red-700 dark:text-red-300" />
            )}
            <span className="font-medium">{nameOf(a.responderId)}</span>
            <span className="text-muted-foreground">
              {a.outcome === "ringing"
                ? `ringing, ${seconds}s left`
                : a.outcome === "accepted"
                  ? "accepted"
                  : a.outcome === "missed"
                    ? "missed the call"
                    : `rejected: ${rejectReasons[a.reason!].label}`}
            </span>
          </li>
        ))}
      </ol>
      {call.hazards.length ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
          <TriangleAlert className="size-3.5" />
          Hazard reported near {call.hazards.map(nameOf).join(", ")}
        </p>
      ) : null}
      {call.state === "unassigned" ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-800 dark:text-red-300">
          <CircleAlert className="size-3.5" />
          No responder accepted. Dismiss and call someone manually.
        </p>
      ) : null}
      {ringing && ringing.responderId !== demoResponder.id ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="text-[11px] text-muted-foreground">
            Simulate {nameOf(ringing.responderId)} (demo):
          </span>
          <Button size="xs" variant="outline" onClick={() => simulate(true)}>
            Accept
          </Button>
          <Button size="xs" variant="outline" onClick={() => simulate(false)}>
            Reject
          </Button>
        </div>
      ) : null}
    </div>
  );
}
