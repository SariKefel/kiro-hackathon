import Link from "next/link";
import { ArrowUpRight, CircleHelp, Hand, TriangleAlert } from "lucide-react";
import { personnel } from "@/features/incidents/demo-data";

export function PriorityAlerts() {
  return (
    <section
      id="priority-alerts"
      data-tour="priority-alerts"
      className="panel scroll-mt-6 p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="section-heading">Needs your attention</h2>
        <span className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
          4 personnel
        </span>
      </div>
      <div className="space-y-3">
        {personnel
          .filter((p) => p.status === "needs_help" || p.status === "unable_to_continue")
          .map((p) => (
            <Link
              href={`/personnel?search=${encodeURIComponent(p.name)}`}
              key={p.id}
              className="block rounded-lg border border-red-100 bg-red-50/30 p-4 hover:bg-red-50/70 dark:border-red-950 dark:bg-red-950/20"
            >
              <div className="flex items-center gap-2">
                {p.status === "needs_help" ? (
                  <Hand className="size-3.5 text-red-700 dark:text-red-300" />
                ) : (
                  <TriangleAlert className="size-3.5 text-orange-700 dark:text-orange-300" />
                )}
                <h3 className="text-xs font-semibold">{p.name}</h3>
                <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.message}</p>
              <p className="mt-2 text-[10px] font-medium text-red-800 dark:text-red-300">
                {p.status === "needs_help" ? "Assistance requested" : "Follow-up required"} ·{" "}
                {p.team} team
              </p>
            </Link>
          ))}
      </div>
      <Link
        href="/personnel?status=unknown"
        className="mt-4 flex items-start gap-2.5 rounded-lg bg-amber-50/70 p-3.5 text-xs dark:bg-amber-950/30"
      >
        <CircleHelp className="mt-0.5 size-4 shrink-0 text-amber-800 dark:text-amber-300" />
        <span className="leading-relaxed">
          <strong className="font-medium">2 personnel need a status check.</strong>
          <span className="mt-0.5 block text-muted-foreground">
            Jason Wong and Hakim Zain have no current confirmation.
          </span>
        </span>
        <ArrowUpRight className="ml-auto size-3.5 shrink-0" />
      </Link>
    </section>
  );
}
