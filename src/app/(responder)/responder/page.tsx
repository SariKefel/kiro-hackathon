import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardList, MapPin, Radio, ShieldCheck } from "lucide-react";
import { demoResponder, incident, tasks } from "@/features/incidents/demo-data";
import { DemoBanner } from "@/components/shared/demo-banner";
import { ConnectionStatus } from "@/components/shared/connection-status";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { LocalReports } from "@/features/check-ins/report-state";
import { ActiveDispatch } from "@/features/dispatch/responder";

export const metadata: Metadata = { title: "Responder home" };
export default function ResponderHome() {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Hello, Amir.</h1>
          <p className="mt-1 text-sm font-medium text-ink-2">Field responder, Alpha team</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Review your assignment or save a safety check-in.
          </p>
        </div>
        <span
          role="img"
          aria-label={demoResponder.name}
          className="flex size-11 items-center justify-center rounded-full border bg-card text-sm font-semibold"
        >
          AH
        </span>
      </div>
      <DemoBanner responder />
      <div className="border-b border-rule pb-2">
        <ConnectionStatus detailed />
      </div>
      <ActiveDispatch />
      {/* The waterproof notebook entry: an ink head with the last confirmed time, then cells. */}
      <section
        data-tour="responder-safety"
        aria-labelledby="last-confirmed"
        className="overflow-hidden rounded-2xl bg-card shadow-[0_0_0_1px_var(--color-ink),var(--shadow-lift)]"
      >
        <div className="flex items-end justify-between gap-3 bg-chrome px-5 py-4 text-chrome-ink">
          <div>
            <h2 id="last-confirmed" className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck aria-hidden="true" className="size-4 text-chrome-signal" />
              Last confirmed status
            </h2>
            <p className="figure-mono mt-1 text-4xl leading-none">08:37</p>
          </div>
          <span className="text-sm text-chrome-muted">15 Nov 2026, MYT</span>
        </div>
        <dl className="grid grid-cols-2 divide-x divide-ink border-b border-ink text-sm">
          <div className="px-5 py-3">
            <dt className="text-ink-3">Status</dt>
            <dd className="mt-1">
              <StatusBadge status="safe" />
            </dd>
          </div>
          <div className="px-5 py-3">
            <dt className="text-ink-3">Source</dt>
            <dd className="mt-1 font-medium">Sample server check-in</dd>
          </div>
          <div className="col-span-2 border-t border-ink px-5 py-3">
            <dt className="text-ink-3">Your active incident</dt>
            <dd className="mt-1">
              <h3 className="text-base">{incident.title}</h3>
            </dd>
            <dd className="mt-1 flex items-center gap-1.5 text-ink-2">
              <MapPin aria-hidden="true" className="size-3.5" />
              {incident.location}
            </dd>
          </div>
        </dl>
        <div className="p-4">
          <Button asChild className="h-14 w-full text-base">
            <Link href="/responder/check-in">
              <Radio aria-hidden="true" className="size-5" />
              Report my safety
              <ArrowRight aria-hidden="true" className="ml-auto size-4" />
            </Link>
          </Button>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A new local report does not change this confirmation.
          </p>
        </div>
      </section>
      <section data-tour="responder-assignment" aria-labelledby="assignment" className="ruled pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="assignment" className="flex items-center gap-2 section-heading">
            <ClipboardList aria-hidden="true" className="size-4 text-muted-foreground" />
            Current assignment
          </h2>
          <span className="rounded-pill border border-caution-line bg-caution-soft px-2 py-0.5 text-sm font-medium text-caution">
            High priority
          </span>
        </div>
        <h3 className="mt-3 text-lg">{tasks[0].title}</h3>
        <p className="mt-1.5 text-base leading-7 text-ink-2">{tasks[0].description}</p>
        <Link
          href="/responder/tasks"
          className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-signal-text hover:underline"
        >
          View my 2 tasks
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </section>
      <LocalReports />
    </>
  );
}
