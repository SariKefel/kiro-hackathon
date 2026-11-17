"use client";
import { CheckCheck, CloudOff, LoaderCircle, TriangleAlert } from "lucide-react";
import { useOffline } from "@/features/sync/offline-provider";
import { StatusBadge } from "@/components/shared/status-badge";
import { demoResponder, incident, organization } from "@/features/incidents/demo-data";
import { formatDate, formatTime } from "@/lib/utils";
import type { QueuedOperation } from "@/lib/offline/database";

export const persistenceLabels = {
  saved_locally: "Saved locally",
  pending: "Waiting to sync",
  syncing: "Synchronizing",
  confirmed: "Confirmed by server",
  failed: "Failed - action required",
};
export function ReportState({
  operation,
  compact = false,
}: {
  operation: QueuedOperation;
  compact?: boolean;
}) {
  const Icon =
    operation.status === "confirmed"
      ? CheckCheck
      : operation.status === "syncing"
        ? LoaderCircle
        : operation.status === "failed"
          ? TriangleAlert
          : CloudOff;
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-xs font-semibold" role="status">
        <Icon className={`size-4 ${operation.status === "syncing" ? "animate-spin" : ""}`} />
        {persistenceLabels[operation.status]}
      </p>
      {!compact && (
        <>
          <p className="text-xs leading-6 text-muted-foreground">
            {operation.status === "confirmed"
              ? `Server received this report at ${formatTime(operation.serverReceivedAt!)} MYT on ${formatDate(operation.serverReceivedAt!)}.`
              : operation.status === "failed"
                ? operation.error
                : "Your report is saved on this device. The command center has not confirmed receipt."}
          </p>
          {operation.error && operation.status !== "failed" && (
            <p className="text-xs leading-5 text-muted-foreground">{operation.error}</p>
          )}
        </>
      )}
    </div>
  );
}
export function LocalReports() {
  const { operations, ready, storageError } = useOffline();
  const reports = operations.filter(
    (op) =>
      op.payload.userId === demoResponder.id &&
      op.incidentId === incident.id &&
      op.organizationId === organization.id,
  );
  if (!ready) return <p className="muted">Reading reports on this device…</p>;
  if (storageError) return null;
  if (!reports.length)
    return (
      <section data-tour="local-reports" className="panel p-5">
        <h2 className="section-heading">Reports on this device</h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          No local reports yet. Your next check-in will be saved here before a delivery attempt.
        </p>
      </section>
    );
  return (
    <section data-tour="local-reports" className="panel p-5">
      <div className="flex items-center justify-between">
        <h2 className="section-heading">Reports on this device</h2>
        <span className="text-xs text-muted-foreground">{reports.length}</span>
      </div>
      <ul className="mt-3 divide-y">
        {reports.slice(0, 5).map((op) => (
          <li key={op.id} className="space-y-3 py-4">
            <div className="flex items-center justify-between gap-2">
              <StatusBadge status={op.payload.safetyStatus} />
              <time className="text-xs text-muted-foreground" dateTime={op.clientRecordedAt}>
                {formatDate(op.clientRecordedAt)}, {formatTime(op.clientRecordedAt)} MYT
              </time>
            </div>
            {op.payload.message && (
              <p className="break-words text-xs leading-6">{op.payload.message}</p>
            )}
            <ReportState operation={op} compact />
          </li>
        ))}
      </ul>
      {reports.length > 5 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing the latest 5 reports. All {reports.length} remain saved on this device.
        </p>
      )}
    </section>
  );
}
