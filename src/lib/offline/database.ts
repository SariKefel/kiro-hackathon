import Dexie, { type Table } from "dexie";
import type { CheckInOperation } from "@/lib/validations/check-in";

export type QueueStatus = "saved_locally" | "pending" | "syncing" | "confirmed" | "failed";
export interface QueuedOperation extends CheckInOperation {
  status: QueueStatus;
  attempts: number;
  nextAttemptAt: number;
  lastAttemptAt: number | null;
  serverReceivedAt: string | null;
  error: string | null;
}
export class RescueDatabase extends Dexie {
  outbox!: Table<QueuedOperation, string>;
  constructor(name = "rescuesync-demo-v1") {
    super(name);
    this.version(1).stores({
      outbox:
        "id, status, clientRecordedAt, [organizationId+incidentId], [payload.userId+clientRecordedAt]",
    });
  }
}
export const offlineDb = new RescueDatabase();
