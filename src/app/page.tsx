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
import { Button } from "@/components/ui/button";

export default function EntryPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-10">
        <Brand />
        <div className="flex items-center gap-3">
          <span className="rounded-pill border border-rule-2 px-2 py-0.5 text-sm font-medium text-ink-2">
            <span className="sm:hidden">Demo</span>
            <span className="hidden sm:inline">Demo workspace</span>
          </span>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-5 pb-12 pt-6 sm:px-8 lg:px-10 lg:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <h1 className="text-[44px] leading-[1.02] tracking-[-0.045em] sm:text-[60px] xl:text-[72px]">
              Every person.
              <br />
              Accounted for.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-ink-2">
              Know who needs help, and save check-ins even when the connection drops.
            </p>
            <div role="group" aria-labelledby="choose-view" className="mt-8">
              <h2 id="choose-view" className="sr-only">
                Choose your response view
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Commander view",
                    description: "Track team safety and coordinate the response.",
                    identity: "Nadia Rahman, demo commander",
                    href: "/dashboard",
                    icon: LayoutDashboard,
                    primary: true,
                  },
                  {
                    title: "Responder view",
                    description: "Review your assignment and save a check-in.",
                    identity: "Amir Hassan, demo responder",
                    href: "/responder",
                    icon: Smartphone,
                    primary: false,
                  },
                ].map(({ title, description, identity, href, icon: Icon, primary }) => (
                  <div key={href} className="min-w-0">
                    <Button
                      asChild
                      size="lg"
                      variant={primary ? "default" : "outline"}
                      className="w-full justify-start"
                    >
                      <Link href={href}>
                        <Icon aria-hidden="true" className="size-5" />
                        {title}
                        <ArrowRight aria-hidden="true" className="ml-auto size-4" />
                      </Link>
                    </Button>
                    <p className="mt-2 text-sm leading-6 text-ink-2">{description}</p>
                    <p className="text-sm text-ink-3">{identity}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                Explore with a sample identity. No account required.
              </p>
            </div>
          </div>
          <section
            aria-label="Sample flood response"
            className="overflow-hidden rounded-2xl bg-card shadow-[0_0_0_1px_var(--color-ink),var(--shadow-lift)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 bg-chrome px-5 py-3 text-chrome-ink">
              <span className="flex items-center gap-2 text-sm font-medium">
                <RadioTower aria-hidden="true" className="size-4 text-chrome-signal" />A shared view
                of the response
              </span>
              <span className="text-sm text-chrome-muted">Sample incident</span>
            </div>
            <div className="p-4 sm:p-5">
              <h2 className="text-xl">Klang Valley flood response</h2>
              <p className="mb-4 mt-1.5 flex items-center gap-1.5 text-sm text-ink-2">
                <MapPin aria-hidden="true" className="size-3.5" />
                Shah Alam, Selangor
              </p>
              <IncidentMap preview />
            </div>
            <dl className="grid grid-cols-3 divide-x divide-ink border-y border-ink">
              <div className="px-5 py-3">
                <dt className="text-sm text-ink-3">Assigned</dt>
                <dd className="mt-0.5 font-display text-3xl font-semibold tabular-nums">10</dd>
              </div>
              <div className="px-5 py-3">
                <dt className="text-sm text-ink-3">Confirmed safe</dt>
                <dd className="mt-0.5 font-display text-3xl font-semibold tabular-nums text-safe">
                  6
                </dd>
              </div>
              <div className="px-5 py-3">
                <dt className="text-sm text-ink-3">Response teams</dt>
                <dd className="mt-0.5 font-display text-3xl font-semibold tabular-nums">3</dd>
              </div>
            </dl>
            <p className="flex items-start gap-2 px-5 py-3 text-sm leading-6 text-muted-foreground">
              <Check aria-hidden="true" className="mt-1 size-4 shrink-0" />
              Illustrative reports and assignments for exploring the demo.
            </p>
          </section>
        </div>
        <div className="ruled mt-14 grid gap-x-10 gap-y-6 pt-6 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CloudOff aria-hidden="true" className="mt-1 size-5 shrink-0 text-signal-text" />
            <div>
              <h2 className="text-lg">Keep checking in offline</h2>
              <p className="mt-1 max-w-md text-base leading-7 text-muted-foreground">
                Save reports on your device when a connection is unavailable.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-1 size-5 shrink-0 text-signal-text" />
            <div>
              <h2 className="text-lg">See what is saved locally</h2>
              <p className="mt-1 max-w-md text-base leading-7 text-muted-foreground">
                Demo reports stay on this device. Delivery to command is not enabled.
              </p>
            </div>
          </div>
        </div>
        <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <HeartHandshake aria-hidden="true" className="size-4" />
          Built for the people who show up for others.
        </p>
      </main>
    </div>
  );
}
