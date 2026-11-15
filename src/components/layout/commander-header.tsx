import Link from "next/link";
import { Bell, ChevronRight, Circle } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { commander } from "@/features/incidents/demo-data";

export function CommanderHeader() {
  return (
    <header className="flex min-h-[76px] items-center justify-between gap-3 border-b bg-card px-5 md:px-8 lg:px-9">
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="hidden text-muted-foreground lg:inline">Selangor Response Network</span>
        <ChevronRight className="hidden size-3.5 text-muted-foreground lg:block" />
        <Link href="/incidents" className="truncate font-medium">
          Klang Valley flood response
        </Link>
        <span className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <Circle className="size-1.5 fill-current" />
          Active
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <ThemeToggle />
        <Link
          href="/dashboard#priority-alerts"
          aria-label="View 4 personnel requiring attention"
          className="relative flex size-10 items-center justify-center rounded-lg hover:bg-secondary"
        >
          <Bell className="size-[18px]" />
          <span className="absolute right-2.5 top-2 size-1.5 rounded-full bg-orange-500" />
        </Link>
        <span className="mx-1 hidden h-6 border-l sm:block" />
        <Link
          href="/settings"
          aria-label={`${commander.name}, demo commander settings`}
          className="flex size-9 items-center justify-center rounded-full border bg-[#e7edf5] text-xs font-semibold text-[#3e5876]"
        >
          NR
        </Link>
      </div>
    </header>
  );
}
