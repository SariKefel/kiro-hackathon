import { describe, expect, test } from "bun:test";
import {
  checkInPayloadSchema,
  operationSchema,
  syncRequestSchema,
} from "../src/lib/validations/check-in";

const payload = {
  userId: "demo-user-1",
  safetyStatus: "safe",
  message: "All clear",
  latitude: null,
  longitude: null,
};
describe("check-in trust boundary", () => {
  test("accepts the three explicit safety statuses, but never unknown", () => {
    for (const safetyStatus of ["safe", "needs_help", "unable_to_continue"])
      expect(checkInPayloadSchema.safeParse({ ...payload, safetyStatus }).success).toBe(true);
    expect(checkInPayloadSchema.safeParse({ ...payload, safetyStatus: "unknown" }).success).toBe(
      false,
    );
  });
  test("validates coordinate pairs and bounds", () => {
    expect(
      checkInPayloadSchema.safeParse({ ...payload, latitude: 3.07, longitude: 101.51 }).success,
    ).toBe(true);
    for (const coords of [
      { latitude: 91, longitude: 101 },
      { latitude: 3, longitude: null },
      { latitude: 3, longitude: -181 },
      { latitude: NaN, longitude: 1 },
    ])
      expect(checkInPayloadSchema.safeParse({ ...payload, ...coords }).success).toBe(false);
  });
  test("rejects oversized messages and untrusted extra fields", () => {
    expect(checkInPayloadSchema.safeParse({ ...payload, message: "x".repeat(501) }).success).toBe(
      false,
    );
    expect(checkInPayloadSchema.safeParse({ ...payload, confirmed: true }).success).toBe(false);
  });
  test("requires stable IDs, supported versions, timestamps and bounded batches", () => {
    expect(operationSchema.safeParse({ version: 2, id: "arbitrary" }).success).toBe(false);
    expect(syncRequestSchema.safeParse({ version: 1, operations: [] }).success).toBe(false);
    expect(
      syncRequestSchema.safeParse({ version: 1, operations: Array(26).fill({}) }).success,
    ).toBe(false);
  });
});
