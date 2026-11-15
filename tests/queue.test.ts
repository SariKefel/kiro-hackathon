import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { RescueDatabase } from "../src/lib/offline/database";
import {
  enqueueCheckIn,
  pendingCount,
  retryPending,
  synchronizeQueue,
  type SyncTransport,
} from "../src/features/check-ins/queue";
import type { CheckInOperation } from "../src/lib/validations/check-in";

let db: RescueDatabase;
const now = 1_800_000_000_000;
function operation(): CheckInOperation {
  return {
    id: crypto.randomUUID(),
    type: "personnel.check_in",
    version: 1,
    organizationId: "10000000-0000-4000-8000-000000000001",
    incidentId: "20000000-0000-4000-8000-000000000001",
    clientRecordedAt: new Date(now).toISOString(),
    payload: {
      userId: "demo-user-1",
      safetyStatus: "safe",
      message: "All clear",
      latitude: null,
      longitude: null,
    },
  };
}
function transport(acknowledgements: unknown[]): SyncTransport {
  return (async () => Response.json({ version: 1, acknowledgements })) as SyncTransport;
}
beforeEach(() => {
  db = new RescueDatabase(`test-${crypto.randomUUID()}`);
});
afterEach(async () => {
  await db.delete();
});

describe("durable local outbox", () => {
  test("persists across close/reopen and de-duplicates stable operation IDs", async () => {
    const op = operation();
    await enqueueCheckIn(op, db);
    await enqueueCheckIn(op, db);
    db.close();
    await db.open();
    expect(await pendingCount(db)).toBe(1);
    expect((await db.outbox.get(op.id))?.payload.message).toBe("All clear");
  });
  test("network failure retains reports with retry metadata", async () => {
    const op = operation();
    await enqueueCheckIn(op, db);
    await synchronizeQueue(
      db,
      (async () => {
        throw new Error("Offline");
      }) as SyncTransport,
      now,
    );
    const saved = await db.outbox.get(op.id);
    expect(saved?.status).toBe("pending");
    expect(saved?.attempts).toBe(1);
    expect(saved?.nextAttemptAt).toBeGreaterThan(now);
    expect(await pendingCount(db)).toBe(1);
  });
  test("missing, demo, and mismatched acknowledgements cannot confirm a report", async () => {
    const op = operation();
    await enqueueCheckIn(op, db);
    for (const acks of [
      [],
      [
        {
          id: crypto.randomUUID(),
          status: "confirmed",
          serverReceivedAt: new Date(now).toISOString(),
        },
      ],
      [{ id: op.id, status: "unavailable", message: "Demo Mode" }],
      [{ id: op.id, status: "confirmed" }],
    ]) {
      await retryPending(db);
      await synchronizeQueue(db, transport(acks), now);
      expect((await db.outbox.get(op.id))?.status).toBe("pending");
      expect(await pendingCount(db)).toBe(1);
    }
  });
  test("only a valid per-operation acknowledgement confirms and removes pending count", async () => {
    const op = operation();
    await enqueueCheckIn(op, db);
    await synchronizeQueue(
      db,
      transport([
        { id: op.id, status: "confirmed", serverReceivedAt: new Date(now).toISOString() },
      ]),
      now,
    );
    expect((await db.outbox.get(op.id))?.status).toBe("confirmed");
    expect(await pendingCount(db)).toBe(0);
    expect(await db.outbox.count()).toBe(1);
  });
  test("expired sync leases recover after an interrupted browser session", async () => {
    const op = operation();
    await enqueueCheckIn(op, db);
    await db.outbox.update(op.id, { status: "syncing", lastAttemptAt: now - 60_000 });
    await synchronizeQueue(db, transport([]), now);
    expect((await db.outbox.get(op.id))?.status).toBe("pending");
  });
  test("parallel workers claim an operation only once", async () => {
    const op = operation();
    await enqueueCheckIn(op, db);
    let calls = 0;
    const send = (async () => {
      calls++;
      return Response.json({ version: 1, acknowledgements: [] });
    }) as SyncTransport;
    await Promise.all([synchronizeQueue(db, send, now), synchronizeQueue(db, send, now)]);
    expect(calls).toBe(1);
  });
  test("permanent rejections stay visible for user action instead of retrying endlessly", async () => {
    const op = operation();
    await enqueueCheckIn(op, db);
    await synchronizeQueue(
      db,
      transport([{ id: op.id, status: "rejected", message: "Assignment requires review" }]),
      now,
    );
    expect((await db.outbox.get(op.id))?.status).toBe("failed");
    expect(await pendingCount(db)).toBe(1);
    await synchronizeQueue(db, transport([]), now + 600_000);
    expect((await db.outbox.get(op.id))?.attempts).toBe(1);
  });
  test("partial batches only confirm reports explicitly acknowledged", async () => {
    const first = operation();
    const second = operation();
    await enqueueCheckIn(first, db);
    await enqueueCheckIn(second, db);
    await synchronizeQueue(
      db,
      transport([
        { id: first.id, status: "confirmed", serverReceivedAt: new Date(now).toISOString() },
      ]),
      now,
    );
    expect((await db.outbox.get(first.id))?.status).toBe("confirmed");
    expect((await db.outbox.get(second.id))?.status).toBe("pending");
  });
});
