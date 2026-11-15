import { Check, CircleHelp, Hand, TriangleAlert } from "lucide-react";
import type { AccountabilityStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

export const statusDetails = {
  safe: {
    label: "Safe",
    icon: Check,
    className: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  needs_help: {
    label: "Needs help",
    icon: Hand,
    className: "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300",
  },
  unable_to_continue: {
    label: "Unable to continue",
    icon: TriangleAlert,
    className: "bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  },
  unknown: {
    label: "Unknown",
    icon: CircleHelp,
    className: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
};
export function StatusBadge({ status }: { status: AccountabilityStatus }) {
  const details = statusDetails[status];
  const Icon = details.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        details.className,
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {details.label}
    </span>
  );
}
