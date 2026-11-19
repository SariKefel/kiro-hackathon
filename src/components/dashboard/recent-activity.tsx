import Link from "next/link";
import { Check, Hand, TriangleAlert } from "lucide-react";
import { personnel } from "@/features/incidents/demo-data";
import { formatTime } from "@/lib/utils";

// A field log: time first in mono, then who and what, on ruled rows.
export function RecentActivity({ expanded = false }: { expanded?: boolean }) {
  const entries = personnel
    .filter((p) => p.lastCheckIn && p.status !== "unknown")
    .slice(0, expanded ? 8 : 4);
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="section-heading">Recent check-ins</h2>
        <span className="text-sm text-ink-3">15 Nov, MYT</span>
      </div>
      <ol className="ruled mt-3 divide-y divide-rule">
        {entries.map((p) => {
          const Icon =
            p.status === "safe" ? Check : p.status === "needs_help" ? Hand : TriangleAlert;
          const tone =
            p.status === "safe"
              ? "text-safe"
              : p.status === "needs_help"
                ? "text-help"
                : "text-caution";
          return (
            <li key={p.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-3">
              <time dateTime={p.lastCheckIn!} className="figure-mono pt-0.5 text-sm text-ink-2">
                {formatTime(p.lastCheckIn!)}
              </time>
              <div className="min-w-0">
                <Link
                  href={`/personnel?search=${encodeURIComponent(p.name)}`}
                  className="text-sm font-semibold hover:underline"
                >
                  {p.name}
                </Link>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-ink-3">
                  <span className={`inline-flex items-center gap-1.5 font-medium ${tone}`}>
                    <Icon aria-hidden="true" className="size-3.5" />
                    {p.status === "safe"
                      ? "Checked in safe"
                      : p.status === "needs_help"
                        ? "Requested assistance"
                        : "Reported unable to continue"}
                  </span>
                  <span>{p.team} team</span>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <Link
        href="/personnel"
        className="mt-1 flex min-h-11 items-center justify-center border-t border-rule text-sm font-medium text-signal-text hover:underline"
      >
        View personnel directory
      </Link>
    </section>
  );
}
