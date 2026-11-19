import Link from "next/link";
import { ArrowUpRight, CircleHelp, Hand, TriangleAlert } from "lucide-react";
import { personnel } from "@/features/incidents/demo-data";

// One sheet with a red ink rule on top: each person is a ruled row, not a card inside the card.
export function PriorityAlerts() {
  return (
    <section
      id="priority-alerts"
      data-tour="priority-alerts"
      className="panel scroll-mt-6 overflow-hidden border-t-2 border-t-help-fill"
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
        <h2 className="section-heading">Needs your attention</h2>
        <span className="rounded-pill bg-help-soft px-2 py-0.5 text-sm font-medium text-help">
          4 personnel
        </span>
      </div>
      <ul className="divide-y divide-rule border-y border-rule">
        {personnel
          .filter((p) => p.status === "needs_help" || p.status === "unable_to_continue")
          .map((p) => (
            <li key={p.id}>
              <Link
                href={`/personnel?search=${encodeURIComponent(p.name)}`}
                className="group block px-5 py-4 transition-colors duration-[var(--dur-micro)] hover:bg-paper-3/60 active:bg-paper-3 sm:px-6"
              >
                <div className="flex items-center gap-2">
                  {p.status === "needs_help" ? (
                    <Hand aria-hidden="true" className="size-4 text-help" />
                  ) : (
                    <TriangleAlert aria-hidden="true" className="size-4 text-caution" />
                  )}
                  <h3 className="text-base font-semibold group-hover:underline">{p.name}</h3>
                  <ArrowUpRight aria-hidden="true" className="ml-auto size-4 text-ink-3" />
                </div>
                <p className="mt-1.5 text-sm leading-6 text-ink-2">{p.message}</p>
                <p className="mt-1.5 flex flex-wrap gap-x-3 text-sm">
                  <span
                    className={`font-medium ${p.status === "needs_help" ? "text-help" : "text-caution"}`}
                  >
                    {p.status === "needs_help" ? "Assistance requested" : "Follow-up required"}
                  </span>
                  <span className="text-ink-3">{p.team} team</span>
                </p>
              </Link>
            </li>
          ))}
      </ul>
      <Link
        href="/personnel?status=unknown"
        className="group flex items-start gap-2.5 px-5 py-4 transition-colors duration-[var(--dur-micro)] hover:bg-paper-3/60 active:bg-paper-3 sm:px-6"
      >
        <CircleHelp aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-caution" />
        <span className="text-sm leading-6">
          <strong className="font-medium group-hover:underline">
            2 personnel need a status check.
          </strong>
          <span className="block text-ink-3">
            Jason Wong and Hakim Zain have no current confirmation.
          </span>
        </span>
        <ArrowUpRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-ink-3" />
      </Link>
    </section>
  );
}
