import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3, MapPin, Users, Waves } from "lucide-react";
import { incident } from "@/features/incidents/demo-data";
import { DemoBanner } from "@/components/shared/demo-banner";
import { IncidentMap } from "@/components/incidents/incident-map";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { PriorityAlerts } from "@/components/dashboard/priority-alerts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Button } from "@/components/ui/button";
import { DispatchPanel } from "@/features/dispatch/dispatch-panel";

export const metadata: Metadata = { title: "Incident details" };
export default async function IncidentPage({
  params,
}: {
  params: Promise<{ incidentId: string }>;
}) {
  const { incidentId } = await params;
  if (incidentId !== incident.id) notFound();
  return (
    <div className="space-y-6">
      <Link
        href="/incidents"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        All incidents
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{incident.title}</h1>
          <p
            role="status"
            className="mt-3 inline-flex items-center gap-1.5 rounded-pill border border-safe-line bg-safe-soft px-2 py-0.5 text-sm font-medium text-safe"
          >
            <Waves aria-hidden="true" className="size-4" />
            Flood response, active
          </p>
        </div>
        <Button asChild>
          <Link href={`/personnel?incident=${incident.id}`}>
            <Users aria-hidden="true" className="size-4" />
            Incident personnel
          </Link>
        </Button>
      </div>
      <dl className="grid grid-cols-2 border-y-2 border-ink text-sm sm:grid-cols-4 sm:divide-x sm:divide-rule">
        <div className="py-3 sm:px-4 sm:first:pl-0">
          <dt className="flex items-center gap-1.5 text-ink-3">
            <MapPin aria-hidden="true" className="size-3.5" />
            Location
          </dt>
          <dd className="mt-0.5 font-medium">{incident.location}</dd>
        </div>
        <div className="py-3 sm:px-4">
          <dt className="flex items-center gap-1.5 text-ink-3">
            <Clock3 aria-hidden="true" className="size-3.5" />
            Activated
          </dt>
          <dd className="figure-mono mt-0.5">14 Nov 2026, 22:00 MYT</dd>
        </div>
        <div className="py-3 sm:px-4">
          <dt className="text-ink-3">Teams</dt>
          <dd className="figure-mono mt-0.5">3</dd>
        </div>
        <div className="py-3 sm:px-4">
          <dt className="text-ink-3">Personnel</dt>
          <dd className="figure-mono mt-0.5">10</dd>
        </div>
      </dl>
      <DemoBanner />
      <section aria-labelledby="response-area" className="space-y-4">
        <div className="max-w-3xl">
          <h2 id="response-area" className="text-xl">
            Response area
          </h2>
          <p className="mt-2 text-base leading-7 text-ink-2">{incident.description}</p>
        </div>
        <IncidentMap large />
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Operational focus: Seksyen 7 welfare checks, boat access support, and the SK Seksyen 7
          relief centre. Select a location to manage its demo responder assignments.
        </p>
      </section>
      <SummaryCards />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <DispatchPanel />
          <PriorityAlerts />
        </div>
        <RecentActivity expanded />
      </div>
    </div>
  );
}
