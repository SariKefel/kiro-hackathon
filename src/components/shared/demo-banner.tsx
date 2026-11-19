import { FlaskConical } from "lucide-react";

// A ruled note, not a tinted callout: it sits on the paper and states what the figures are.
export function DemoBanner({ responder = false }: { responder?: boolean }) {
  return (
    <aside
      data-tour="demo-mode"
      aria-label="Demo mode information"
      className="flex items-start gap-3 border-y border-rule-2 py-3 text-ink-2"
    >
      <FlaskConical aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">
          {responder
            ? "Demo Mode: Amir Hassan's sample identity"
            : "Demo Mode: sample response data"}
        </p>
        <p className="mt-0.5 text-sm leading-6 text-ink-3">
          {responder ? (
            "Check-ins stay on this device and are not delivered to command."
          ) : (
            <>
              Snapshot <time className="text-ink-2">15 Nov 2026, 08:40 MYT</time>. Check-ins saved
              on this device do not update these figures.
            </>
          )}
        </p>
      </div>
    </aside>
  );
}
