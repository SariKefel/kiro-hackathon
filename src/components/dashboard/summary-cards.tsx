import { CheckCheck, CircleHelp, HeartHandshake, Users } from "lucide-react";
import Link from "next/link";
import { getAccountability } from "@/features/incidents/demo-data";

export function SummaryCards() {
  const count = getAccountability();
  const cards = [
    {
      label: "Assigned personnel",
      value: count.total,
      icon: Users,
      detail: "Across 3 response teams",
      href: "/personnel",
      color: "text-slate-600 dark:text-slate-300",
    },
    {
      label: "Confirmed safe",
      value: count.safe,
      icon: CheckCheck,
      detail: `${count.total ? Math.round((count.safe / count.total) * 100) : 0}% of assigned personnel`,
      href: "/personnel?status=safe",
      color: "text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Need assistance",
      value: count.assistance,
      icon: HeartHandshake,
      detail: "Review requests for help",
      href: "/personnel?status=assistance",
      color: "text-red-700 dark:text-red-300",
    },
    {
      label: "Status unknown",
      value: count.unknown,
      icon: CircleHelp,
      detail: "Follow up on missing check-ins",
      href: "/personnel?status=unknown",
      color: "text-amber-800 dark:text-amber-300",
    },
  ];
  return (
    <section
      data-tour="accountability-summary"
      aria-label="Personnel safety summary"
      className="panel grid grid-cols-2 overflow-hidden lg:grid-cols-4"
    >
      {cards.map(({ label, value, icon: Icon, detail, href, color }, index) => (
        <Link
          href={href}
          key={label}
          aria-label={`${label}: ${value}. View personnel`}
          className={`group min-w-0 p-4 transition-colors hover:bg-secondary/60 focus-visible:relative focus-visible:z-10 sm:p-5 ${index % 2 === 1 ? "border-l" : ""} ${index > 1 ? "border-t lg:border-t-0" : ""} ${index === 2 ? "lg:border-l" : ""}`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium sm:text-sm">{label}</p>
            <Icon aria-hidden="true" className={`size-[18px] shrink-0 ${color}`} />
          </div>
          <p
            className={`mt-3 text-4xl font-semibold leading-none tracking-tight tabular-nums ${color}`}
          >
            {value}
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{detail}</p>
        </Link>
      ))}
    </section>
  );
}
