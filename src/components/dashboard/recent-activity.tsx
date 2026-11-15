import Link from "next/link";
import { Check, Hand, TriangleAlert } from "lucide-react";
import { personnel } from "@/features/incidents/demo-data";
import { formatTime } from "@/lib/utils";

export function RecentActivity({ expanded = false }: { expanded?: boolean }) {
  const entries = personnel
    .filter((p) => p.lastCheckIn && p.status !== "unknown")
    .slice(0, expanded ? 8 : 4);
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-heading">Recent check-ins</h2>
        <span className="text-[10px] text-muted-foreground">15 Nov · MYT</span>
      </div>
      <ol className="mt-2 divide-y">
        {entries.map((p) => {
          const Icon =
            p.status === "safe" ? Check : p.status === "needs_help" ? Hand : TriangleAlert;
          return (
            <li key={p.id} className="flex gap-3 py-4">
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${p.status === "safe" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"}`}
              >
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/personnel?search=${encodeURIComponent(p.name)}`}
                    className="text-xs font-semibold hover:text-primary"
                  >
                    {p.name}
                  </Link>
                  <time
                    dateTime={p.lastCheckIn!}
                    className="shrink-0 text-[10px] tabular-nums text-muted-foreground"
                  >
                    {formatTime(p.lastCheckIn!)}
                  </time>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {p.status === "safe"
                    ? "Checked in safe"
                    : p.status === "needs_help"
                      ? "Requested assistance"
                      : "Reported unable to continue"}{" "}
                  <span className="text-border">/</span> {p.team} team
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <Link
        href="/personnel"
        className="mt-1 block border-t pt-4 text-center text-xs font-medium text-primary dark:text-teal-300"
      >
        View personnel directory
      </Link>
    </section>
  );
}
