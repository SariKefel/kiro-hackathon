import { DemoTourWelcome } from "@/features/demo-tour/demo-tour";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Waves } from "lucide-react";
import { Accountability } from "@/components/dashboard/accountability";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PriorityAlerts } from "@/components/dashboard/priority-alerts";
import { IncidentMap } from "@/components/incidents/incident-map";
import { DemoBanner } from "@/components/shared/demo-banner";
import { Button } from "@/components/ui/button";
import { incident } from "@/features/incidents/demo-data";

export const metadata: Metadata = { title: "Commander overview" };
// The first screen answers two questions: how many people are accounted for, and who needs
// follow-up now. The incident record, the field log and the map come after.
export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Operations overview</h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            Review team safety, follow up on check-ins, and coordinate your response.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/personnel">
            View personnel
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>
      <DemoBanner />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Accountability />
        <PriorityAlerts />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-labelledby="incident-record" className="ruled min-w-0 pt-4">
          <p
            role="status"
            className="inline-flex items-center gap-1.5 rounded-pill border border-safe-line bg-safe-soft px-2 py-0.5 text-sm font-medium text-safe"
          >
            <Waves aria-hidden="true" className="size-4" />
            Active incident, response active
          </p>
          <h2 id="incident-record" className="mt-3 text-2xl">
            {incident.title}
          </h2>
          <p className="mt-2 text-base leading-7 text-ink-2">
            Evacuation, rescue support, and welfare checks across flood-affected communities.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 border-t border-rule text-sm">
            <div className="border-b border-rule py-3">
              <dt className="text-ink-3">Location</dt>
              <dd className="mt-0.5 font-medium">{incident.location}</dd>
            </div>
            <div className="border-b border-rule py-3">
              <dt className="text-ink-3">Activated</dt>
              <dd className="figure-mono mt-0.5">14 Nov, 22:00 MYT</dd>
            </div>
            <div className="border-b border-rule py-3">
              <dt className="text-ink-3">Teams deployed</dt>
              <dd className="figure-mono mt-0.5">3</dd>
            </div>
            <div className="border-b border-rule py-3">
              <dt className="text-ink-3">Personnel</dt>
              <dd className="figure-mono mt-0.5">10</dd>
            </div>
          </dl>
          <Link
            href={`/incidents/${incident.id}`}
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-signal-text hover:underline"
          >
            Incident details
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
        <RecentActivity />
      </div>
      <IncidentMap large />
      <DemoTourWelcome />
      <p className="pb-2 text-sm leading-6 text-muted-foreground">
        Sample reports are illustrative and are not live operational data.
      </p>
    </div>
  );
}
