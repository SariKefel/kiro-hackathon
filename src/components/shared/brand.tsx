import Link from "next/link";
import { RadioTower } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="RescueSync home"
      className={cn("inline-flex items-center gap-2.5", light && "text-chrome-ink")}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-brand-ink">
        <RadioTower aria-hidden="true" className="size-5" strokeWidth={2} />
      </span>
      {!compact && (
        <span className="font-display text-xl font-semibold tracking-[-0.04em]">
          Rescue
          <span className={light ? "text-chrome-signal" : "text-signal-text"}>Sync</span>
        </span>
      )}
    </Link>
  );
}
