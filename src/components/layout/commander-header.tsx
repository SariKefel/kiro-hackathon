import { DemoTourButton } from "@/features/demo-tour/demo-tour";
import Link from "next/link";
import { Bell } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { commander } from "@/features/incidents/demo-data";

export function CommanderHeader() {
  return (
    <header className="flex h-[76px] items-center justify-between gap-3 border-b bg-card px-4 sm:px-5 md:px-8 lg:px-9">
      <div className="min-w-0">
        <p className="mb-1 text-xs text-muted-foreground">
          <span className="sm:hidden">Demo workspace</span>
          <span className="hidden sm:inline">Selangor Response Network</span>
        </p>
        <Link
          href="/incidents"
          className="block text-sm font-semibold sm:truncate"
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
          className="relative flex size-11 items-center justify-center rounded-lg hover:bg-secondary"
        >
          <Bell aria-hidden="true" className="size-[18px]" />
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-900 dark:bg-amber-900 dark:text-amber-100"
          >
            4
          </span>
        </Link>
        <span className="mx-2 hidden h-7 border-l sm:block" />
        <Link
          href="/settings"
          aria-label={`${commander.name}, demo commander settings`}
          className="flex size-10 items-center justify-center rounded-full border bg-secondary text-xs font-semibold"
        >
          NR
        </Link>
      </div>
    </header>
  );
}
