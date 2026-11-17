"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, Play } from "lucide-react";
import type { Driver } from "driver.js";
import { tourForPath } from "./steps";

export function DemoTourButton({ prominent = false }: { prominent?: boolean }) {
  const pathname = usePathname();
  const active = useRef<Driver | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(
    () => () => {
      generation.current += 1;
      active.current?.destroy();
      active.current = null;
    },
    [pathname],
  );

  async function start(trigger: HTMLButtonElement) {
    if (busy.current) return;
    const current = generation.current;
    busy.current = true;
    setLoading(true);
    setError(false);
    try {
      const { driver } = await import("driver.js");
      if (current !== generation.current) return;
      active.current?.destroy();
      const { steps } = tourForPath(pathname);
      const visibleSteps = steps.filter(
        ({ element }) =>
          !element ||
          (typeof element === "string" && document.querySelector(element)?.getClientRects().length),
      );
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      active.current = driver({
        steps: visibleSteps,
        showProgress: true,
        progressText: "{{current}} of {{total}}",
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Try it now",
        allowClose: true,
        allowKeyboardControl: true,
        disableActiveInteraction: true,
        animate: !reducedMotion,
        smoothScroll: !reducedMotion,
        overlayColor: "#142537",
        overlayOpacity: 0.65,
        stagePadding: 6,
        stageRadius: 12,
        popoverClass: "rescuesync-tour",
        onDestroyed: () => {
          active.current = null;
          if (trigger.isConnected) trigger.focus({ preventScroll: true });
        },
      });
      active.current.drive();
    } catch {
      active.current?.destroy();
      if (current === generation.current) setError(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label={prominent ? "Start guided demo" : "Tour this view"}
        title="Tour this view"
        disabled={loading}
        onClick={(event) => void start(event.currentTarget)}
        className={
          prominent
            ? "inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            : "inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium hover:bg-secondary disabled:opacity-60"
        }
      >
        {prominent ? (
          <Play className="size-4" aria-hidden="true" />
        ) : (
          <CircleHelp className="size-[18px]" aria-hidden="true" />
        )}
        <span className={prominent ? "" : "hidden lg:inline"}>
          {loading ? "Loading guide…" : prominent ? "Start guided demo" : "Tour this view"}
        </span>
      </button>
      {error && (
        <span role="alert" className="max-w-40 text-xs text-destructive">
          Guide could not load. Please try again.
        </span>
      )}
    </span>
  );
}

export function DemoTourWelcome() {
  return (
    <section
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card px-5 py-4"
      aria-label="Guided demo"
    >
      <div className="max-w-xl">
        <h2 className="text-sm font-semibold">New to RescueSync?</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Take a two-minute tour of the command center, response map, and demo assignments. Each
          view has its own guide.
        </p>
      </div>
      <DemoTourButton prominent />
    </section>
  );
}
