import Link from "next/link";
import {
  ArrowRight,
  Check,
  CloudOff,
  HeartHandshake,
  LayoutDashboard,
  MapPin,
  RadioTower,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { IncidentMap } from "@/components/incidents/incident-map";

export default function EntryPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-10">
        <Brand />
        <div className="flex items-center gap-3">
          <span className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="sm:hidden">Demo</span>
            <span className="hidden sm:inline">Demo workspace</span>
          </span>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-5 pb-10 pt-6 sm:px-8 lg:px-10 lg:pt-12">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.08fr] lg:gap-14">
          <div className="lg:pt-3">
            <h1 className="max-w-xl text-[44px] font-semibold leading-[1.08] tracking-[-0.055em] sm:text-[56px] xl:text-[64px]">
              Every person.
              <br />
              Accounted for.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
              Coordinate your response. Know who needs help. Save a safety check-in, even when the
              connection drops.
            </p>
            <div className="mt-8">
              <h2 className="text-base font-semibold">Choose your response view</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Explore with a sample identity. No account required.
              </p>
              <div className="mt-4 divide-y overflow-hidden rounded-xl border bg-card">
                {[
                  {
                    title: "Commander view",
                    description: "Track team safety and coordinate the response.",
                    identity: "Nadia Rahman, demo commander",
                    href: "/dashboard",
                    icon: LayoutDashboard,
                  },
                  {
                    title: "Responder view",
                    description: "Review your assignment and save a check-in.",
                    identity: "Amir Hassan, demo responder",
                    href: "/responder",
                    icon: Smartphone,
                  },
                ].map(({ title, description, identity, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-start gap-3 p-4 transition-colors hover:bg-secondary/60 focus-visible:relative focus-visible:z-10 sm:gap-4 sm:p-5"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-signal-text">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold">{title}</span>
                      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                        {description}
                      </span>
                      <span className="mt-2 block text-xs text-muted-foreground">{identity}</span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-3 size-4 shrink-0 text-muted-foreground group-hover:text-primary dark:group-hover:text-signal-text"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <section
            aria-label="Sample flood response"
            className="overflow-hidden rounded-2xl border bg-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
              <span className="flex items-center gap-2 text-sm font-medium">
                <RadioTower aria-hidden="true" className="size-4 text-signal-text" />A shared view
                of the response
              </span>
              <span className="text-xs text-muted-foreground">Sample incident</span>
            </div>
            <div className="p-4 sm:p-5">
              <h2 className="text-lg font-semibold tracking-tight">Klang Valley flood response</h2>
              <p className="mb-4 mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin aria-hidden="true" className="size-3.5" />
                Shah Alam, Selangor
              </p>
              <IncidentMap preview />
              <dl className="mt-5 grid grid-cols-3 divide-x">
                <div className="pr-3">
                  <dt className="text-xs text-muted-foreground">Assigned</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums">10</dd>
                </div>
                <div className="px-4">
                  <dt className="text-xs text-muted-foreground">Confirmed safe</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-safe">6</dd>
                </div>
                <div className="pl-4">
                  <dt className="text-xs text-muted-foreground">Response teams</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums">3</dd>
                </div>
              </dl>
            </div>
            <p className="flex items-start gap-2 border-t bg-secondary/40 px-5 py-3 text-xs leading-5 text-muted-foreground">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Illustrative reports and assignments for exploring the demo.
            </p>
          </section>
        </div>
        <div className="mt-10 grid gap-6 border-t pt-7 sm:grid-cols-2 lg:mt-12">
          <div className="flex items-start gap-3">
            <CloudOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-signal-text" />
            <div>
              <h2 className="text-sm font-semibold">Keep checking in offline</h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Save reports on your device when a connection is unavailable.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-signal-text" />
            <div>
              <h2 className="text-sm font-semibold">See what is saved locally</h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Demo reports stay on this device. Delivery to command is not enabled.
              </p>
            </div>
          </div>
        </div>
        <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
          <HeartHandshake aria-hidden="true" className="size-4" />
          Built for the people who show up for others.
        </p>
      </main>
    </div>
  );
}
