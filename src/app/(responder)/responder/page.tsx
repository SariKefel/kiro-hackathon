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
      <div className="rounded-lg border bg-card px-4 py-2">
        <ConnectionStatus detailed />
      </div>
      <ActiveDispatch />
      <section data-tour="responder-safety" className="panel overflow-hidden">
        <div className="border-b px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground">Your active incident</p>
          <h2 className="mt-1.5 text-base font-semibold tracking-tight">{incident.title}</h2>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {incident.location}
          </p>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs font-medium">
              <ShieldCheck className="size-4 text-safe" />
              Last confirmed status
            </span>
            <StatusBadge status="safe" />
          </div>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Sample server check-in: 15 Nov 2026, 08:37 MYT.
            <br />A new local report does not change this confirmation.
          </p>
          <Button asChild className="mt-5 h-14 w-full text-base">
            <Link href="/responder/check-in">
              <Radio className="size-5" />
              Report my safety
              <ArrowRight className="ml-auto size-4" />
            </Link>
          </Button>
        </div>
      </section>
      <section data-tour="responder-assignment" className="panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 section-heading">
            <ClipboardList className="size-4 text-muted-foreground" />
            Current assignment
          </h2>
          <span className="rounded bg-caution-soft px-2 py-1 text-xs font-medium text-caution">
            High priority
          </span>
        </div>
        <h3 className="text-sm font-semibold">{tasks[0].title}</h3>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">{tasks[0].description}</p>
        <Link
          href="/responder/tasks"
          className="mt-4 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-signal-text"
        >
          View my 2 tasks
          <ArrowRight className="size-3.5" />
        </Link>
      </section>
      <LocalReports />
    </>
  );
}
