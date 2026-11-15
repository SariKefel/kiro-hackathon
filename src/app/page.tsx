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
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-10">
        <Brand />
        <div className="flex items-center gap-4">
          <span className="rounded-md border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground">
            Phase 1 demo
          </span>
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-6 pb-12 pt-8 md:px-10 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <span className="mb-7 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-primary dark:text-teal-300">
              <RadioTower className="size-3.5" />
              Connected by purpose. Ready offline.
            </span>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.12] tracking-[-0.055em] md:text-[62px]">
              Every person.
              <br />
              Accounted for.
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-muted-foreground">
              When conditions change, clarity matters. Coordinate your response and report your
              safety, even when the connection is uncertain.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary dark:text-teal-300" />
                Personnel accountability
              </span>
              <span className="flex items-center gap-2">
                <CloudOff className="size-4 text-primary dark:text-teal-300" />
                Local-first check-ins
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_12px_50px_-25px_rgba(20,37,55,0.3)]">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <span className="size-2 rounded-full bg-emerald-600" />
                  One response. A shared picture.
                </span>
                <span className="text-[10px] text-muted-foreground">Sample incident</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <MapPin className="size-3.5" />
                  Shah Alam, Selangor
                </div>
                <h2 className="mb-4 mt-2 text-lg font-semibold tracking-tight">
                  Klang Valley flood response
                </h2>
                <IncidentMap />
                <div className="mt-5 grid grid-cols-3 divide-x">
                  <div className="pr-3">
                    <p className="text-2xl font-semibold tracking-tight">10</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">People assigned</p>
                  </div>
                  <div className="px-4">
                    <p className="text-2xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">
                      06
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Confirmed safe</p>
                  </div>
                  <div className="pl-4">
                    <p className="text-2xl font-semibold tracking-tight">03</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Teams in the field</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t bg-secondary/40 px-5 py-3 text-[10px] text-muted-foreground">
                <Check className="size-3.5 text-primary dark:text-teal-300" />
                Designed to keep people at the center of the response.
              </div>
            </div>
          </div>
        </div>
        <div className="mt-14 border-t pt-8 md:mt-20">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Choose your response view</h2>
            <p className="text-xs text-muted-foreground">
              Explore with clearly labeled demo identities. No account required.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Incident commander",
                description:
                  "See your teams, track safety, and focus on the people who need support.",
                identity: "Nadia Rahman · Demo commander",
                href: "/dashboard",
                icon: LayoutDashboard,
              },
              {
                title: "Field responder",
                description:
                  "Check in quickly, review your assignment, and save reports on your device.",
                identity: "Amir Hassan · Demo responder",
                href: "/responder",
                icon: Smartphone,
              },
            ].map(({ title, description, identity, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group panel flex items-start gap-4 p-5 transition-colors hover:border-primary md:p-6"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary dark:text-teal-300">
                  <Icon className="size-5" />
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground">
                    {description}
                  </p>
                  <p className="mt-4 text-[10px] font-medium text-primary dark:text-teal-300">
                    {identity}
                  </p>
                </div>
                <ArrowRight className="mt-3 size-4 text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-[10px] leading-6 text-muted-foreground">
            <p className="flex items-center gap-2">
              <HeartHandshake className="size-3.5" />
              Built for the people who show up for others.
            </p>
            <p>Demo reports stay on this device. Remote delivery is not enabled.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
