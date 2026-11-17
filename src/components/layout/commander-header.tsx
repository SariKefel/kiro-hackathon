import { DemoTourButton } from "@/features/demo-tour/demo-tour";
import Link from "next/link";
import { Bell } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { commander } from "@/features/incidents/demo-data";

export function CommanderHeader() {
  return (
    <header className="flex h-[72px] items-center justify-between gap-3 border-b border-rule bg-paper px-4 sm:px-6 md:px-10">
      <div className="min-w-0">
        <p className="mb-1 text-xs text-muted-foreground">
          <span className="sm:hidden">Demo workspace</span>
          <span className="hidden sm:inline">Selangor Response Network</span>
        </p>
        <Link
          href="/incidents"
          className="block font-display text-base font-semibold tracking-[-0.01em] hover:underline truncate"
          title="Klang Valley flood response"
        >
          <span className="sm:hidden">Command center</span>
          <span className="hidden sm:inline">Klang Valley flood response</span>
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <DemoTourButton />
        <ThemeToggle />
        <Link
          href="/dashboard#priority-alerts"
          aria-label="View 4 personnel requiring attention"
          className="relative flex size-11 items-center justify-center rounded-md hover:bg-secondary active:bg-paper-3"
        >
          <Bell aria-hidden="true" className="size-[18px]" />
          <span
            aria-hidden="true"
            className="figure-mono absolute right-0 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-help-fill px-0.5 text-xs leading-none font-medium text-brand-ink"
          >
            4
          </span>
        </Link>
        <span className="mx-2 hidden h-7 border-l sm:block" />
        <Link
          href="/settings"
          aria-label={`${commander.name}, demo commander settings`}
          className="flex size-10 items-center justify-center rounded-full border border-rule-2 bg-paper-2 text-xs font-semibold hover:bg-paper-3 active:bg-paper-3"
        >
          NR
        </Link>
      </div>
    </header>
  );
}
