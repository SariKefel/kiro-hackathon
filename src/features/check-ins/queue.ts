import {
  operationSchema,
  syncResponseSchema,
  type CheckInOperation,
} from "@/lib/validations/check-in";
import { offlineDb, type RescueDatabase, type QueuedOperation } from "@/lib/offline/database";

export async function enqueueCheckIn(input: CheckInOperation, db: RescueDatabase = offlineDb) {
  const operation = operationSchema.parse(input);
  await db.transaction("rw", db.outbox, async () => {
    if (await db.outbox.get(operation.id)) return;
    await db.outbox.add({
      ...operation,
      status: "saved_locally",
      attempts: 0,
      nextAttemptAt: 0,
      lastAttemptAt: null,
      serverReceivedAt: null,
      error: null,
    });
  });
  return operation.id;
}

export async function pendingCount(db: RescueDatabase = offlineDb) {
  return db.outbox.filter((op) => op.status !== "confirmed").count();
}

export async function retryPending(db: RescueDatabase = offlineDb) {
  await db.outbox
    .filter((op) => op.status !== "confirmed" && op.status !== "syncing")
    .modify({ status: "pending", nextAttemptAt: 0, error: null });
}

export type SyncTransport = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function synchronizeQueue(
  db: RescueDatabase = offlineDb,
  transport: SyncTransport = fetch,
  now = Date.now(),
) {
  // The transaction claims operations across tabs. Expired leases survive interrupted requests.
  const operations = await db.transaction("rw", db.outbox, async () => {
    const eligible = await db.outbox
      .filter(
        (op) =>
          ((op.status === "saved_locally" || op.status === "pending") && op.nextAttemptAt <= now) ||
          (op.status === "syncing" && (op.lastAttemptAt ?? 0) < now - 45_000),
      )
      .limit(25)
      .toArray();
    for (const op of eligible) {
      await db.outbox.update(op.id, {
        status: "syncing",
        lastAttemptAt: now,
        attempts: op.attempts + 1,
      });
    }
    return eligible;
  });
  if (!operations.length) return;
  let response;
  try {
    const result = await transport("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        version: 1,
        operations: operations.map((op) =>
          operationSchema.parse({
            id: op.id,
            type: op.type,
            version: op.version,
            organizationId: op.organizationId,
            incidentId: op.incidentId,
            clientRecordedAt: op.clientRecordedAt,
            payload: op.payload,
          }),
        ),
      }),
    });
    if (!result.ok)
      throw new Error(
        `Server unavailable (HTTP ${result.status}). Report retained on this device.`,
      );
    response = syncResponseSchema.parse(await result.json());
  } catch (error) {
    await retain(
      operations,
      error instanceof Error ? error.message : "No server acknowledgement. Report retained.",
    );
    return;
  }
  for (const op of operations) {
    const acks = response.acknowledgements.filter((ack) => ack.id === op.id);
    const ack = acks.length === 1 ? acks[0] : undefined;
    if (ack?.status === "confirmed" && ack.serverReceivedAt) {
      await db.outbox.update(op.id, {
        status: "confirmed",
        serverReceivedAt: ack.serverReceivedAt,
        error: null,
      });
    } else if (ack?.status === "rejected") {
      await db.outbox.update(op.id, {
        status: "failed",
        error: ack.message ?? "Server rejected this report. Review and retry.",
      });
    } else {
      await retain([op], ack?.message ?? "No matching server acknowledgement. Report retained.");
    }
  }

  async function retain(items: QueuedOperation[], error: string) {
    for (const op of items) {
      await db.outbox.update(op.id, {
        status: "pending",
        error,
        nextAttemptAt: now + Math.min(300_000, 10_000 * 2 ** Math.min(op.attempts, 5)),
      });
    }
  }
}
