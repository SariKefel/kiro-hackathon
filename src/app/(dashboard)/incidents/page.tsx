import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Waves } from "lucide-react";
import { incident } from "@/features/incidents/demo-data";
import { IncidentMap } from "@/components/incidents/incident-map";
import { DemoBanner } from "@/components/shared/demo-banner";

export const metadata: Metadata = { title: "Incidents" };
export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Incidents</h1>
        <p className="mt-2 muted">A shared operational picture for your response teams.</p>
      </div>
      <DemoBanner />
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="size-2 rounded-full bg-emerald-600" />
        Active incidents<span className="rounded bg-secondary px-2 py-0.5 text-xs">1</span>
      </div>
      <article className="panel overflow-hidden">
        <div className="p-6 sm:p-8">
          <Waves className="mb-5 size-7 text-primary dark:text-teal-300" />
          <p className="mb-2 text-xs text-muted-foreground">Flood · Active response</p>
          <h2 className="text-2xl font-semibold tracking-tight">{incident.title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{incident.description}</p>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-4" />
            {incident.location}
          </p>
          <Link
            href={`/incidents/${incident.id}`}
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white"
          >
            Open incident
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="border-t p-4">
          <IncidentMap large />
        </div>
      </article>
      <p className="text-xs text-muted-foreground">
        Select a response location to review or adjust its demo responder assignments.
      </p>
    </div>
  );
}
