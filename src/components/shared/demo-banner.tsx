import { FlaskConical } from "lucide-react";

export function DemoBanner({ responder = false }: { responder?: boolean }) {
  return (
    <aside
      data-tour="demo-mode"
      aria-label="Demo mode information"
      className="flex items-start gap-3 rounded-lg border border-sky-200/70 bg-sky-50/60 px-4 py-3 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"
    >
      <FlaskConical
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-sky-700 dark:text-sky-300"
      />
      <div className="min-w-0">
        <p className="text-xs font-semibold">
          {responder
            ? "Demo Mode - Amir Hassan's sample identity"
            : "Demo Mode - sample response data"}
        </p>
        <p className="mt-1 text-xs leading-5 text-sky-900 dark:text-sky-200">
          {responder
            ? "Check-ins stay on this device and are not delivered to command."
            : "Snapshot: 15 Nov 2026, 08:40 MYT. Check-ins saved on this device do not update these figures."}
        </p>
      </div>
    </aside>
  );
}
