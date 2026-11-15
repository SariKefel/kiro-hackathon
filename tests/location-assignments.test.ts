import { afterAll, describe, expect, test } from "bun:test";
import {
  parseAssignments,
  updateLocationAssignment,
} from "../src/features/incidents/assignment-store";

const key = "rescuesync-demo-v1:location-assignments";
const values = new Map<string, string>();
let blockWrites = false;
const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (blockWrites) throw new Error("Storage full");
      values.set(key, value);
    },
  },
});
afterAll(() => {
  if (original) Object.defineProperty(globalThis, "localStorage", original);
  else Reflect.deleteProperty(globalThis, "localStorage");
});

function saved() {
  return parseAssignments(values.get(key) ?? null);
}

describe("demo location assignments", () => {
  test("ignores unknown responders, invalid locations and malformed storage", () => {
    expect(
      parseAssignments('{"demo-user-1":"boat","unknown":"relief","demo-user-2":"invalid"}'),
    ).toEqual({ "demo-user-1": "boat" });
    expect(parseAssignments("not json")).toEqual(parseAssignments(null));
    expect(parseAssignments("[]")).toEqual(parseAssignments(null));
    expect(parseAssignments("{}")).toEqual({});
  });
  test("moves a responder without duplicating them or changing other assignments", () => {
    expect(updateLocationAssignment("demo-user-1", "boat")).toBe(true);
    expect(saved()["demo-user-1"]).toBe("boat");
    expect(saved()["demo-user-2"]).toBe("relief");
  });
  test("rejects new assignments for responders needing attention or invalid input", () => {
    const previous = values.get(key);
    for (const id of ["demo-user-3", "demo-user-5", "demo-user-7", "missing"]) {
      expect(updateLocationAssignment(id, "boat")).toBe(false);
    }
    expect(updateLocationAssignment("demo-user-1", "missing")).toBe(false);
    expect(values.get(key)).toBe(previous);
  });
  test("removal survives serialization and subsequent edits", () => {
    expect(updateLocationAssignment("demo-user-1", null)).toBe(true);
    expect(saved()["demo-user-1"]).toBeUndefined();
    updateLocationAssignment("demo-user-8", "boat");
    expect(saved()["demo-user-1"]).toBeUndefined();
  });
  test("preserves session edits after a storage write failure", () => {
    blockWrites = true;
    expect(updateLocationAssignment("demo-user-1", "relief")).toBe(false);
    blockWrites = false;
    expect(updateLocationAssignment("demo-user-8", "welfare")).toBe(true);
    expect(saved()["demo-user-1"]).toBe("relief");
    expect(saved()["demo-user-8"]).toBe("welfare");
  });
});
