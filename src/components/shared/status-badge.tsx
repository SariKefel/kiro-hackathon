import { Check, CircleHelp, Hand, TriangleAlert } from "lucide-react";
import type { AccountabilityStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

// Reported statuses carry a tinted chip with a solid edge. Unknown is derived, not reported,
// so it stays neutral with a dashed edge and never reads like a confirmation.
export const statusDetails = {
  safe: {
    label: "Safe",
    icon: Check,
    className: "border-safe-line bg-safe-soft text-safe",
  },
  needs_help: {
    label: "Needs help",
    icon: Hand,
    className: "border-help-line bg-help-soft text-help",
  },
  unable_to_continue: {
    label: "Unable to continue",
    icon: TriangleAlert,
    className: "border-caution-line bg-caution-soft text-caution",
  },
  unknown: {
    label: "Unknown",
    icon: CircleHelp,
    className: "border-dashed border-rule-2 bg-paper-3 text-ink-2",
  },
};
export function StatusBadge({ status }: { status: AccountabilityStatus }) {
  const details = statusDetails[status];
  const Icon = details.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border px-2 py-0.5 text-xs font-medium",
        details.className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {details.label}
    </span>
  );
}
