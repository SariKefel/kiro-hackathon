import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getAccountability, personnel, incident } from "@/features/incidents/demo-data";

export function Accountability() {
  const count = getAccountability();
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-heading">Personnel accountability</h2>
        <Link
          href={`/personnel?incident=${incident.id}`}
          aria-label="View all personnel"
          className="flex size-10 items-center justify-center rounded-md text-ink-3 hover:bg-paper-3 hover:text-ink active:bg-rule"
        >
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-4xl font-semibold tracking-[-0.04em] tabular-nums">
          {count.safe}
          <span className="text-xl font-normal text-ink-3"> / {count.total}</span>
        </span>
        <span className="text-sm text-ink-3">confirmed safe</span>
      </div>
      <div
        className="mt-3 flex h-2.5 gap-1 overflow-hidden rounded-sm"
        role="img"
        aria-label="6 safe, 2 need assistance, 2 unknown"
      >
        <span className="w-3/5 rounded-sm bg-safe-fill" />
        <span className="w-1/5 rounded-sm bg-help-fill" />
        <span className="w-1/5 rounded-sm bg-caution-fill" />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-3">
        {[
          { label: "Safe", color: "bg-safe-fill" },
          { label: "Need assistance", color: "bg-help-fill" },
          { label: "Unknown", color: "bg-caution-fill" },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-2 w-3 rounded-sm ${color}`} />
            {label}
          </span>
        ))}
      </div>
      <div className="ruled mt-5 divide-y divide-rule">
        {["Alpha", "Bravo", "Charlie"].map((team) => {
          const members = personnel.filter((p) => p.team === team);
          const safe = members.filter((p) => p.status === "safe").length;
          return (
            <Link
              href={`/personnel?team=${team}`}
              key={team}
              className="group flex min-h-12 items-center gap-3 text-sm transition-colors duration-[var(--dur-micro)] hover:bg-paper-3/60 active:bg-paper-3"
            >
              <span className="font-medium group-hover:underline">{team} team</span>
              <span className="ml-auto text-ink-3 tabular-nums">
                {safe} of {members.length} safe
              </span>
              <ArrowUpRight aria-hidden="true" className="size-3.5 text-ink-3" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
