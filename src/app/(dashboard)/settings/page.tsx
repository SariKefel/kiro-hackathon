import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { DeviceSettings } from "@/features/sync/device-settings";
import { DemoBanner } from "@/components/shared/demo-banner";
import { commander, organization } from "@/features/incidents/demo-data";

export const metadata: Metadata = { title: "Settings" };
export default function SettingsPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="mt-2 muted">Your workspace, appearance, and device status.</p>
      </div>
      <DemoBanner />
      <section className="panel flex flex-wrap items-center gap-5 p-6">
        <span className="flex size-12 items-center justify-center rounded-xl bg-secondary">
          <ShieldCheck className="size-6 text-signal-text" />
        </span>
        <div className="flex-1">
          <h2 className="section-heading">{organization.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {commander.name}, demo incident commander
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-signal-text"
        >
          Switch demo identity
          <ArrowUpRight className="size-3.5" />
        </Link>
      </section>
      <DeviceSettings />
      <section id="about" data-tour="about" className="panel p-6">
        <h2 className="section-heading">About this foundation</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          RescueSync brings personnel accountability into one shared response workspace. This Phase
          1 demonstration includes locally saved check-ins, a foreground retry queue, and a basic
          offline application shell.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Production sign-in and organization access will use Better Auth. This demo does not
          authenticate users, write to Neon, assign real tasks, or deliver emergency notifications.
          Adding a database URL alone does not enable remote delivery.
        </p>
        <Link
          href="/responder"
          className="mt-5 inline-flex min-h-10 items-center gap-2 text-xs font-medium text-signal-text"
        >
          Explore the field responder view
          <ArrowUpRight className="size-3.5" />
        </Link>
      </section>
    </div>
  );
}
