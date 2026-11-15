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
          <p className="mb-1 text-xs text-muted-foreground">Sunday, 15 November 2026</p>
          <h1 className="page-title">Operations overview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every person accounted for. Every response coordinated.
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
      <DemoTourWelcome />
      <SummaryCards />
      <section className="panel overflow-hidden">
        <div className="flex flex-col p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <Waves className="size-4" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">Active incident</span>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-600" />
              Response active
            </span>
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">{incident.title}</h2>
          <p className="mt-2 max-w-lg text-xs leading-6 text-muted-foreground">
            Coordinating evacuation, rescue support, and welfare checks across flood-affected
            communities.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {incident.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              Activated 14 Nov, 22:00 MYT
            </span>
          </div>
          <div className="mt-5 flex items-center justify-between gap-2 border-t pt-4">
            <span className="text-[11px] text-muted-foreground">
              3 teams deployed<span className="mx-2 text-border">/</span>10 personnel
            </span>
            <Link
              href={`/incidents/${incident.id}`}
              className="flex items-center gap-2 text-xs font-semibold text-primary dark:text-teal-300"
            >
              Incident details
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
        <div className="m-3 mt-0">
          <IncidentMap />
        </div>
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_1fr_1.12fr]">
        <Accountability />
        <RecentActivity />
        <PriorityAlerts />
      </div>
      <p className="pb-2 text-center text-[10px] text-muted-foreground">
        RescueSync Demo · Sample reports are illustrative and are not live operational data.
      </p>
    </div>
  );
}
