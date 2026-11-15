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
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-[32px] font-semibold tracking-tight">
          {count.safe}
          <span className="text-lg font-normal text-muted-foreground"> / {count.total}</span>
        </span>
        <span className="text-xs text-muted-foreground">confirmed safe</span>
      </div>
      <div
        className="mt-3 flex h-2.5 gap-1 overflow-hidden rounded-full"
        role="img"
        aria-label="6 safe, 2 need assistance, 2 unknown"
      >
        <span className="w-3/5 rounded-full bg-emerald-500" />
        <span className="w-1/5 rounded-full bg-red-400" />
        <span className="w-1/5 rounded-full bg-amber-400" />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground">
        {[
          { label: "Safe", color: "bg-emerald-500" },
          { label: "Need assistance", color: "bg-red-400" },
          { label: "Unknown", color: "bg-amber-400" },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${color}`} />
            {label}
          </span>
        ))}
      </div>
      <div className="mt-5 divide-y border-t">
        {["Alpha", "Bravo", "Charlie"].map((team) => {
          const members = personnel.filter((p) => p.team === team);
          const safe = members.filter((p) => p.status === "safe").length;
          return (
            <Link
              href={`/personnel?team=${team}`}
              key={team}
              className="flex items-center gap-3 py-3.5 text-xs hover:text-primary"
            >
              <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-[10px] font-semibold">
                {team[0]}
              </span>
              <span className="font-medium">{team} team</span>
              <span className="ml-auto text-muted-foreground">
                {safe} of {members.length} safe
              </span>
              <ArrowUpRight className="size-3 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
