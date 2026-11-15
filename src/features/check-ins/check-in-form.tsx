"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Hand,
  LoaderCircle,
  MapPin,
  Navigation,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkInPayloadSchema } from "@/lib/validations/check-in";
import { enqueueCheckIn } from "@/features/check-ins/queue";
import { useOffline } from "@/features/sync/offline-provider";
import { ReportState } from "@/features/check-ins/report-state";
import { VoiceInput } from "@/features/voice/voice-input";
import { appendTranscript } from "@/features/voice/speech";
import { demoResponder, incident, organization } from "@/features/incidents/demo-data";
import { cn } from "@/lib/utils";
import type { SafetyStatus } from "@/types/domain";

const options = [
  {
    value: "safe",
    title: "I'm safe",
    description: "I am safe and able to continue.",
    icon: Check,
    color: "text-emerald-700 dark:text-emerald-300",
    selected: "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30",
  },
  {
    value: "needs_help",
    title: "I need help",
    description: "I need assistance from my team.",
    icon: Hand,
    color: "text-red-700 dark:text-red-300",
    selected: "border-red-600 bg-red-50/70 dark:bg-red-950/30",
  },
  {
    value: "unable_to_continue",
    title: "Unable to continue",
    description: "I cannot continue my assignment.",
    icon: TriangleAlert,
    color: "text-orange-800 dark:text-orange-300",
    selected: "border-orange-600 bg-orange-50/70 dark:bg-orange-950/30",
  },
] as const;

export function CheckInForm() {
  const [status, setStatus] = useState<SafetyStatus | "">("");
  const [message, setMessage] = useState("");
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const savingRef = useRef(false);
  const { operations, ready, online, sync, storageError } = useOffline();
  const operation = operations.find((op) => op.id === savedId);

  function addTranscript(text: string) {
    const result = appendTranscript(message, text);
    setMessage(result.text);
    setVoiceNotice(
      result.truncated
        ? "The dictated text was shortened to fit the 500 character limit. Review it before saving."
        : null,
    );
  }
  function locate() {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Location is unavailable. You can enter last-known coordinates below.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocationError(
          "Location was not shared. Enter last-known coordinates or leave location blank.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    setError(null);
    const result = checkInPayloadSchema.safeParse({
      userId: demoResponder.id,
      safetyStatus: status,
      message,
      latitude: latitude.trim() === "" ? null : Number(latitude),
      longitude: longitude.trim() === "" ? null : Number(longitude),
    });
    if (!result.success) {
      setError(
        status ? result.error.issues[0].message : "Select your safety status before saving.",
      );
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const id = await enqueueCheckIn({
        id: crypto.randomUUID(),
        type: "personnel.check_in",
        version: 1,
        organizationId: organization.id,
        incidentId: incident.id,
        clientRecordedAt: new Date().toISOString(),
        payload: result.data,
      });
      setSavedId(id);
      if (online) void sync();
    } catch {
      setError(
        "Your report could not be saved. Check that browser storage is enabled, then try again. Nothing has been sent.",
      );
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }
  if (savedId)
    return (
      <section data-tour="check-in-result" className="panel p-6">
        <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-secondary text-primary dark:text-teal-300">
          <ShieldCheck className="size-6" />
        </span>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Check-in saved on this device</h2>
        {operation ? (
          <ReportState operation={operation} />
        ) : (
          <p className="text-sm text-muted-foreground" role="status">
            Saved locally. This demo does not send reports to command.
          </p>
        )}
        <div className="mt-6 rounded-lg bg-secondary/70 p-4 text-xs leading-6">
          Demo Mode does not deliver reports to command. If you need immediate help, use your
          team&apos;s emergency contact channel.
        </div>
        <Button asChild className="mt-6 h-12 w-full">
          <Link href="/responder">
            Return to responder home
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="mt-2 h-11 w-full"
          onClick={() => {
            setSavedId(null);
            setStatus("");
            setMessage("");
            setVoiceNotice(null);
            setLatitude("");
            setLongitude("");
          }}
        >
          Create another check-in
        </Button>
      </section>
    );
  return (
    <form
      onSubmit={submit}
      aria-describedby={error || storageError ? "check-in-error" : undefined}
      className="space-y-5"
    >
      <fieldset data-tour="check-in-status">
        <legend className="mb-3 text-base font-semibold">
          How are you right now?{" "}
          <span className="ml-1 text-xs font-normal text-muted-foreground">Required</span>
        </legend>
        <div className="space-y-3">
          {options.map(({ value, title, description, icon: Icon, color, selected }) => (
            <label
              key={value}
              className={cn(
                "flex min-h-24 cursor-pointer items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-muted-foreground focus-within:ring-2 focus-within:ring-ring/30",
                status === value && selected,
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/70",
                  color,
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block text-base font-semibold">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {description}
                </span>
              </span>
              <input
                type="radio"
                name="safetyStatus"
                required
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
                className="size-5 shrink-0 accent-teal-700"
              />
            </label>
          ))}
        </div>
      </fieldset>
      <details data-tour="check-in-details" className="panel">
        <summary className="min-h-14 cursor-pointer px-5 py-4 text-sm font-semibold">
          Add a message or location{" "}
          <span className="ml-1 text-xs font-normal text-muted-foreground">Optional</span>
        </summary>
        <div className="space-y-4 border-t p-5">
          <div>
            <label htmlFor="message" className="text-sm font-semibold">
              Message <span className="text-xs font-normal text-muted-foreground">Optional</span>
            </label>
            <textarea
              id="message"
              maxLength={500}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setVoiceNotice(null);
              }}
              placeholder="What should your team know?"
              rows={3}
              className="field mt-2 resize-y"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{message.length}/500</p>
            {voiceNotice && (
              <p
                role="status"
                className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300"
              >
                {voiceNotice}
              </p>
            )}
            <VoiceInput onTranscript={addTranscript} online={online} disabled={saving} />
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="size-4" />
                Location <span className="text-xs font-normal text-muted-foreground">Optional</span>
              </h2>
              {(latitude || longitude) && (
                <button
                  type="button"
                  onClick={() => {
                    setLatitude("");
                    setLongitude("");
                  }}
                  className="flex min-h-9 items-center gap-1 text-xs text-muted-foreground"
                >
                  <X className="size-3.5" />
                  Remove
                </button>
              )}
            </div>
            <p className="mb-3 mt-2 text-xs leading-6 text-muted-foreground">
              Share your device location or enter last-known coordinates.
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              disabled={locating}
              onClick={locate}
            >
              {locating ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Navigation className="size-4" />
              )}
              {locating ? "Getting location..." : "Use my current location"}
            </Button>
            {locationError && (
              <p role="alert" className="mt-2 text-xs leading-5 text-amber-800 dark:text-amber-300">
                {locationError}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="latitude" className="text-xs text-muted-foreground">
                  Latitude
                </label>
                <input
                  id="latitude"
                  inputMode="decimal"
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  placeholder="e.g. 3.0738"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="field mt-1"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="text-xs text-muted-foreground">
                  Longitude
                </label>
                <input
                  id="longitude"
                  inputMode="decimal"
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  placeholder="e.g. 101.5183"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="field mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </details>
      {(error || storageError) && (
        <p
          id="check-in-error"
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {error ?? storageError}
        </p>
      )}
      <div>
        <Button
          data-tour="check-in-save"
          type="submit"
          disabled={saving || !ready || Boolean(storageError)}
          className="h-14 w-full text-base"
        >
          {saving ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <ShieldCheck className="size-5" />
          )}
          {saving ? "Saving on this device..." : "Save check-in"}
        </Button>
        <p className="mt-3 text-center text-xs leading-6 text-muted-foreground">
          Demo check-ins stay on this device. Command will not receive them.
        </p>
      </div>
    </form>
  );
}
