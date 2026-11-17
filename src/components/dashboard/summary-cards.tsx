import Link from "next/link";
import { getAccountability } from "@/features/incidents/demo-data";

// The accountability ledger: four figures over one ink rule, each a link into the directory.
// Unknown is set apart with a dashed rule because it is a missing confirmation, not a report.
export function SummaryCards() {
  const count = getAccountability();
  const cards = [
    {
      label: "Assigned personnel",
      value: count.total,
      detail: "Across 3 response teams",
      href: "/personnel",
      color: "text-ink",
      rule: "border-ink",
    },
    {
      label: "Confirmed safe",
      value: count.safe,
      detail: `${count.total ? Math.round((count.safe / count.total) * 100) : 0}% of assigned personnel`,
      href: "/personnel?status=safe",
      color: "text-safe",
      rule: "border-safe-fill",
    },
    {
      label: "Need assistance",
      value: count.assistance,
      detail: "Review requests for help",
      href: "/personnel?status=assistance",
      color: "text-help",
      rule: "border-help-fill",
    },
    {
      label: "Status unknown",
      value: count.unknown,
      detail: "Follow up on missing check-ins",
      href: "/personnel?status=unknown",
      color: "text-caution",
      rule: "border-dashed border-caution-fill",
    },
  ];
  return (
    <section
      data-tour="accountability-summary"
      aria-label="Personnel safety summary"
      className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4"
    >
      {cards.map(({ label, value, detail, href, color, rule }) => (
        <Link
          href={href}
          key={label}
          aria-label={`${label}: ${value}. View personnel`}
          className={`group min-w-0 border-t-2 pt-3 transition-colors duration-[var(--dur-micro)] hover:bg-paper-3/60 focus-visible:relative focus-visible:z-10 active:bg-paper-3 ${rule}`}
        >
          <p className="whitespace-nowrap text-sm font-medium text-ink-2">{label}</p>
          <p
            className={`mt-2 font-display text-5xl leading-none font-semibold tracking-[-0.04em] tabular-nums ${color}`}
          >
            {value}
          </p>
          <p className="mt-2 text-sm text-ink-3 group-hover:text-ink-2">{detail}</p>
        </Link>
      ))}
    </section>
  );
}
