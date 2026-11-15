import Link from "next/link";
import { RadioTower } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="RescueSync home"
      className={cn("inline-flex items-center gap-2.5", light && "text-white")}
    >
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-white">
        <RadioTower className="size-5" strokeWidth={2} />
      </span>
      {!compact && (
        <span className="text-xl font-semibold tracking-[-0.06em]">
          Rescue
          <span className={light ? "text-teal-300" : "text-primary dark:text-teal-300"}>Sync</span>
        </span>
      )}
    </Link>
  );
}
