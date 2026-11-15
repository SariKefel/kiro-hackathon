import { DemoTourWelcome } from "@/features/demo-tour/demo-tour";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Waves } from "lucide-react";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Accountability } from "@/components/dashboard/accountability";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PriorityAlerts } from "@/components/dashboard/priority-alerts";
import { IncidentMap } from "@/components/incidents/incident-map";
import { DemoBanner } from "@/components/shared/demo-banner";
import { Button } from "@/components/ui/button";
import { incident } from "@/features/incidents/demo-data";

export const metadata: Metadata = { title: "Commander overview" };
export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Operations overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review team safety, follow up on check-ins, and coordinate your response.
          </p>
        </div>
        <Button asChild variant="outline" className="bg-card">
          <Link href="/personnel">
            View personnel
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <DemoBanner />
      <SummaryCards />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="xl:col-start-2 xl:row-start-1">
          <PriorityAlerts />
        </div>
        <div className="min-w-0 space-y-5 xl:col-start-1 xl:row-start-1">
          <section className="panel overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Waves
                    aria-hidden="true"
                    className="size-[18px] text-sky-700 dark:text-sky-300"
                  />
                  Active incident
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  Response active
                </span>
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">{incident.title}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Evacuation, rescue support, and welfare checks across flood-affected communities.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin aria-hidden="true" className="size-4" />
                  {incident.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 aria-hidden="true" className="size-4" />
                  Activated 14 Nov, 22:00 MYT
                </span>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <span className="text-xs text-muted-foreground">
                  3 teams deployed, 10 personnel
                </span>
                <Link
                  href={`/incidents/${incident.id}`}
                  className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary dark:text-teal-300"
                >
                  Incident details
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
          </section>
          <Accountability />
        </div>
      </div>
      <IncidentMap large />
      <RecentActivity />
      <DemoTourWelcome />
      <p className="pb-2 text-center text-xs leading-5 text-muted-foreground">
        Sample reports are illustrative and are not live operational data.
      </p>
    </div>
  );
}
