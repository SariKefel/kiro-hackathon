import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DemoBanner({ responder = false }: { responder?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-sky-200/70 bg-sky-50/70 px-3.5 py-3 text-xs leading-relaxed text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
      <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
      <p>
        <Badge
          variant="outline"
          className="mr-1 border-sky-300 bg-transparent text-sky-900 dark:border-sky-700 dark:text-sky-200"
        >
          Demo Mode
        </Badge>{" "}
        {responder
          ? "You are using Amir Hassan's sample identity. Reports save on this device; they are not delivered to command."
          : "Sample incident data as of 15 Nov 2026, 08:40 MYT. Field reports on this device do not update this dashboard."}
      </p>
    </div>
  );
}
