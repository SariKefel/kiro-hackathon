import { CheckCheck, CircleHelp, HeartHandshake, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAccountability } from "@/features/incidents/demo-data";

export function SummaryCards() {
  const count = getAccountability();
  const cards = [
    {
      label: "Assigned personnel",
      value: count.total,
      icon: Users,
      detail: "Across 3 response teams",
      color: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300",
    },
    {
      label: "Confirmed safe",
      value: count.safe,
      icon: CheckCheck,
      detail: "60% of assigned personnel",
      color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      label: "Need assistance",
      value: count.assistance,
      icon: HeartHandshake,
      detail: "1 needs help · 1 unable to continue",
      color: "text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300",
    },
    {
      label: "Status unknown",
      value: count.unknown,
      icon: CircleHelp,
      detail: "Missing or outdated check-in",
      color: "text-amber-800 bg-amber-50 dark:bg-amber-950 dark:text-amber-300",
    },
  ];
  return (
    <div
      data-tour="accountability-summary"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
    >
      {cards.map(({ label, value, icon: Icon, detail, color }) => (
        <Card key={label} className="gap-0 px-4 py-5 shadow-none sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${color}`}
            >
              <Icon className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-[34px] font-semibold leading-tight tracking-[-0.04em] tabular-nums">
            {value.toString().padStart(2, "0")}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{detail}</p>
        </Card>
      ))}
    </div>
  );
}
