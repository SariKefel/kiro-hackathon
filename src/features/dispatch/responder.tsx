"use client";
import { useEffect, useState } from "react";
import {
  Check,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  PhoneOff,
  Siren,
  Timer,
} from "lucide-react";
import { demoResponder } from "@/features/incidents/demo-data";
import { Button } from "@/components/ui/button";
import { dispatchContext, dispatchSites } from "./data";
import {
  secondsLeft,
  distanceKm,
  etaMinutes,
  mapsDirectionsUrl,
  rejectReasons,
  respondToCall,
  ringingAttempt,
  setCallState,
  type DispatchCall,
  type RejectReason,
} from "./logic";
import { updateDispatch, useDispatch, useNow } from "./store";

const me = demoResponder.id;
const myPosition = dispatchContext.positions.find((p) => p.userId === me);
const siteOf = (call: DispatchCall) => dispatchSites.find((s) => s.id === call.siteId)!;

function useRingtone(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let audio: AudioContext | undefined;
    const ring = () => {
      if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.([400, 200, 400]);
      try {
        audio ??= new AudioContext();
        for (const offset of [0, 0.35]) {
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          osc.frequency.value = 880;
          gain.gain.value = 0.08;
          osc.connect(gain).connect(audio.destination);
          osc.start(audio.currentTime + offset);
          osc.stop(audio.currentTime + offset + 0.25);
        }
      } catch {
        // Browsers block audio until the page has had a user gesture. The visual call still shows.
      }
    };
    ring();
    const id = setInterval(ring, 2000);
    return () => {
      clearInterval(id);
      navigator.vibrate?.(0);
      void audio?.close();
    };
  }, [active]);
}

/** Full-screen incoming dispatch, shown on every responder page while a call rings for this responder. */
export function IncomingCall() {
  const state = useDispatch();
  const now = useNow(500);
  const [rejecting, setRejecting] = useState(false);
  const call = state.calls.find((c) => ringingAttempt(c)?.responderId === me);
  const ringing = call && ringingAttempt(call);
  useRingtone(Boolean(ringing));
  // Reset the reason picker when a new call arrives.
  const [seenCall, setSeenCall] = useState<string>();
  if (call?.id !== seenCall) {
    setSeenCall(call?.id);
    setRejecting(false);
  }
  if (!call || !ringing) return null;

  const site = siteOf(call);
  const km = myPosition ? distanceKm(myPosition, site) : null;
  const left = secondsLeft(ringing, now);
  const answer = (accept: boolean, reason?: RejectReason) =>
    updateDispatch((s) =>
      respondToCall(
        s,
        dispatchContext,
        accept
          ? { callId: call.id, responderId: me, now: Date.now(), accept: true }
          : { callId: call.id, responderId: me, now: Date.now(), accept: false, reason: reason! },
      ),
    );

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="incoming-title"
      aria-describedby="incoming-detail"
      className="fixed inset-0 z-50 flex flex-col bg-chrome px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-14 text-chrome-ink"
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center text-center">
        <span className="relative flex size-24 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-help-fill/30 motion-reduce:animate-none" />
          <span className="relative flex size-20 items-center justify-center rounded-full bg-help-fill text-brand-ink">
            <Siren className="size-9" />
          </span>
        </span>
        <p role="status" className="mt-6 text-sm font-medium text-chrome-signal">
          Incoming {site.priority} dispatch
        </p>
        <h1 id="incoming-title" className="mt-2 text-3xl">
          {site.name}
        </h1>
        <p id="incoming-detail" className="mt-3 text-base leading-7 text-chrome-muted">
          {site.need}
        </p>
        <dl className="mt-6 grid w-full grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-chrome-2 p-3">
            <dt className="text-xs text-chrome-muted">Distance</dt>
            <dd className="figure-mono mt-1 text-lg font-medium">
              {km === null ? "?" : `${km.toFixed(1)} km`}
            </dd>
          </div>
          <div className="rounded-lg bg-chrome-2 p-3">
            <dt className="text-xs text-chrome-muted">Est. travel</dt>
            <dd className="figure-mono mt-1 text-lg font-medium">
              {km === null ? "?" : `~${etaMinutes(km)} min`}
            </dd>
          </div>
          <div className="rounded-lg bg-chrome-2 p-3">
            <dt className="flex items-center justify-center gap-1 text-xs text-chrome-muted">
              <Timer className="size-3" />
              Respond in
            </dt>
            <dd className="figure-mono mt-1 text-lg font-medium" aria-live="off">
              {left}s
            </dd>
          </div>
        </dl>

        {rejecting ? (
          <fieldset className="mt-auto w-full pt-8">
            <legend className="mb-3 w-full text-center text-sm font-medium">
              Why can&apos;t you take it? It goes to the next nearest responder.
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(rejectReasons) as RejectReason[]).map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => answer(false, reason)}
                  className="min-h-14 rounded-md border border-chrome-rule bg-chrome-2 px-3 text-sm font-medium hover:bg-chrome-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chrome-signal active:translate-y-px"
                >
                  {rejectReasons[reason].label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="mt-4 min-h-10 text-sm text-chrome-signal underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-chrome-signal"
            >
              Back
            </button>
          </fieldset>
        ) : (
          <div className="mt-auto flex w-full justify-around pt-8">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setRejecting(true)}
                aria-label="Reject dispatch"
                className="flex size-18 items-center justify-center rounded-full bg-help-fill text-brand-ink hover:bg-help-fill/90 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-chrome-ink active:scale-95 motion-reduce:active:scale-100"
              >
                <PhoneOff className="size-8" />
              </button>
              <span className="text-sm">Reject</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => {
                  answer(true);
                  // Opened inside the tap so browsers allow it. On a phone this hands off to the maps app.
                  window.open(mapsDirectionsUrl(site), "_blank", "noopener");
                  updateDispatch((s) => setCallState(s, call.id, "en_route"));
                }}
                aria-label="Accept dispatch and start navigation"
                className="flex size-18 items-center justify-center rounded-full bg-safe-fill text-brand-ink hover:bg-safe-fill/90 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-chrome-ink active:scale-95 motion-reduce:active:scale-100"
              >
                <Phone className="size-8" />
              </button>
              <span className="text-sm">Accept &amp; navigate</span>
            </div>
          </div>
        )}
        <p className="mt-6 text-xs text-chrome-muted">Demo dispatch with sample data</p>
      </div>
    </div>
  );
}

/** The dispatch this responder accepted, with navigation and progress. */
export function ActiveDispatch() {
  const state = useDispatch();
  const [nearby, setNearby] = useState<string>();
  const call = state.calls.find(
    (c) =>
      ["accepted", "en_route", "arrived"].includes(c.state) &&
      c.attempts.at(-1)?.responderId === me,
  );
  if (!call) return null;
  const site = siteOf(call);
  const km = myPosition ? distanceKm(myPosition, site) : null;
  const move = (to: "en_route" | "arrived") => updateDispatch((s) => setCallState(s, call.id, to));
  const checkLocation = () => {
    if (!navigator.geolocation) return setNearby("Location is not available on this device.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const metres = distanceKm(coords, site) * 1000;
        setNearby(
          metres <= 100
            ? "You are within 100 m of the site. Mark yourself arrived."
            : `About ${(metres / 1000).toFixed(1)} km from the site.`,
        );
      },
      () => setNearby("Location permission was not granted. You can still mark progress manually."),
    );
  };

  return (
    <section className="panel overflow-hidden border-primary" aria-labelledby="active-dispatch">
      <div className="bg-primary px-5 py-4 text-primary-foreground">
        <p role="status" className="text-xs font-medium">
          {call.state === "arrived"
            ? "Dispatch on site"
            : call.state === "en_route"
              ? "Dispatch en route"
              : "Dispatch accepted"}
        </p>
        <h2 id="active-dispatch" className="mt-1 text-lg">
          {site.name}
        </h2>
      </div>
      <div className="space-y-4 p-5">
        <p className="text-xs leading-6 text-muted-foreground">{site.need}</p>
        {km !== null ? (
          <p className="flex items-center gap-1.5 text-xs">
            <MapPin className="size-3.5 text-muted-foreground" />
            <span className="figure-mono">{km.toFixed(1)} km</span> from your last check-in, about{" "}
            <span className="figure-mono">{etaMinutes(km)} min</span> away
          </p>
        ) : null}
        <Button asChild className="h-14 w-full text-base">
          <a href={mapsDirectionsUrl(site)} target="_blank" rel="noreferrer">
            <Navigation className="size-5" />
            Navigate to site
          </a>
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-12"
            onClick={() => move("en_route")}
            disabled={call.state !== "accepted"}
          >
            En route
          </Button>
          <Button
            variant="outline"
            className="h-12"
            onClick={() => move("arrived")}
            disabled={call.state === "arrived"}
          >
            <Check />
            Arrived
          </Button>
        </div>
        {call.state !== "arrived" ? (
          <button
            type="button"
            onClick={checkLocation}
            className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap text-sm font-semibold text-signal-text"
          >
            <LocateFixed className="size-3.5" />
            Check my distance with location
          </button>
        ) : null}
        {nearby ? (
          <p role="status" className="text-xs text-muted-foreground">
            {nearby}
          </p>
        ) : null}
        <p className="text-xs leading-5 text-muted-foreground">
          Navigate opens your maps app for the route. Site details stay on this device if you lose
          signal.
        </p>
      </div>
    </section>
  );
}
