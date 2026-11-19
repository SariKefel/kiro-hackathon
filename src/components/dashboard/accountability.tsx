import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getAccountability, personnel, incident } from "@/features/incidents/demo-data";

const teams = ["Alpha", "Bravo", "Charlie"] as const;

// The accountability ledger: every team against every status, totals under a 2px ink rule.
// Unknown is a missing or outdated confirmation, so its column is set apart with a dashed rule.
export function Accountability() {
  const count = getAccountability();
  const columns = [
    {
      label: "Confirmed safe",
      short: "Safe",
      href: "/personnel?status=safe",
      total: count.safe,
      tone: "text-safe",
      rule: "border-safe-fill",
      of: (team: string) => personnel.filter((p) => p.team === team && p.status === "safe").length,
    },
    {
      label: "Need assistance",
      short: "Assistance",
      href: "/personnel?status=assistance",
      total: count.assistance,
      tone: "text-help",
      rule: "border-help-fill",
      of: (team: string) =>
        personnel.filter(
          (p) =>
            p.team === team && (p.status === "needs_help" || p.status === "unable_to_continue"),
        ).length,
    },
    {
      label: "Status unknown",
      short: "Unknown",
      href: "/personnel?status=unknown",
      total: count.unknown,
      tone: "text-caution",
      rule: "border-dashed border-caution-fill",
      of: (team: string) =>
        personnel.filter((p) => p.team === team && p.status === "unknown").length,
    },
  ];
  const safeShare = count.total ? Math.round((count.safe / count.total) * 100) : 0;

  return (
    <section
      data-tour="accountability-summary"
      aria-labelledby="ledger-heading"
      className="panel min-w-0 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="ledger-heading" className="section-heading">
          Personnel accountability
        </h2>
        <Link
          href={`/personnel?incident=${incident.id}`}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-signal-text hover:underline"
        >
          All {count.total} personnel
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        <Link
          href="/personnel"
          aria-label={`Assigned personnel: ${count.total}. View personnel`}
          className="group min-w-0 border-t-2 border-ink pt-2 hover:bg-paper-3/60 active:bg-paper-3"
        >
          <span className="block whitespace-nowrap text-sm font-medium text-ink-2">Assigned</span>
          <span className="mt-1 block font-display text-5xl leading-none font-semibold tracking-[-0.04em] tabular-nums">
            {count.total}
          </span>
          <span className="mt-2 block text-sm text-ink-3">Across 3 response teams</span>
        </Link>
        {columns.map((column) => (
          <Link
            key={column.label}
            href={column.href}
            aria-label={`${column.label}: ${column.total}. View personnel`}
            className={`group min-w-0 border-t-2 pt-2 hover:bg-paper-3/60 active:bg-paper-3 ${column.rule}`}
          >
            <span className="block whitespace-nowrap text-sm font-medium text-ink-2">
              {column.label}
            </span>
            <span
              className={`mt-1 block font-display text-5xl leading-none font-semibold tracking-[-0.04em] tabular-nums ${column.tone}`}
            >
              {column.total}
            </span>
            <span className="mt-2 block text-sm text-ink-3">
              {column.label === "Confirmed safe"
                ? `${safeShare}% of assigned personnel`
                : column.label === "Need assistance"
                  ? "Review requests for help"
                  : "Follow up on missing check-ins"}
            </span>
          </Link>
        ))}
      </div>

      <div
        className="mt-6 flex h-2 gap-0.5 overflow-hidden rounded-sm"
        role="img"
        aria-label={`${count.safe} safe, ${count.assistance} need assistance, ${count.unknown} unknown`}
      >
        <span className="rounded-sm bg-safe-fill" style={{ flexGrow: count.safe }} />
        <span className="rounded-sm bg-help-fill" style={{ flexGrow: count.assistance }} />
        <span className="rounded-sm bg-caution-fill" style={{ flexGrow: count.unknown }} />
      </div>

      <table className="mt-6 w-full text-sm">
        <caption className="sr-only">Accountability by team</caption>
        <thead>
          <tr className="border-b border-ink text-left text-ink-2">
            <th scope="col" className="py-2 pr-3 font-medium">
              Team
            </th>
            {columns.map((column) => (
              <th key={column.label} scope="col" className="px-3 py-2 text-right font-medium">
                {column.short}
              </th>
            ))}
            <th scope="col" className="py-2 pl-3 text-right font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {teams.map((team) => {
            const members = personnel.filter((p) => p.team === team).length;
            return (
              <tr key={team} className="group hover:bg-paper-3/60">
                <th scope="row" className="py-0 pr-3 text-left font-medium">
                  <Link
                    href={`/personnel?team=${team}`}
                    className="flex min-h-11 items-center gap-1.5 whitespace-nowrap group-hover:underline"
                  >
                    {team} team
                  </Link>
                </th>
                {columns.map((column) => {
                  const value = column.of(team);
                  return (
                    <td
                      key={column.label}
                      className={`figure-mono px-3 text-right ${value ? column.tone : "text-ink-3"}`}
                    >
                      {value}
                    </td>
                  );
                })}
                <td className="figure-mono pl-3 text-right">{members}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
