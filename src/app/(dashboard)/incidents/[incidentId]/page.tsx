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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Waves className="size-4" />
            Flood response
            <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Active
            </span>
          </div>
          <h1 className="page-title">{incident.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {incident.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              Activated 14 Nov 2026, 22:00 MYT
            </span>
          </div>
        </div>
        <Button asChild>
          <Link href={`/personnel?incident=${incident.id}`}>
            <Users className="size-4" />
            Incident personnel
          </Link>
        </Button>
      </div>
      <DemoBanner />
      <SummaryCards />
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <section className="panel p-6">
            <h2 className="section-heading">Response area</h2>
            <p className="mb-5 mt-2 text-sm leading-7 text-muted-foreground">
              {incident.description}
            </p>
            <IncidentMap large />
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              Operational focus: Seksyen 7 welfare checks, boat access support, and the SK Seksyen 7
              relief centre. All map positions are illustrative.
            </p>
          </section>
          <DispatchPanel />
          <PriorityAlerts />
        </div>
        <RecentActivity expanded />
      </div>
    </div>
  );
}
