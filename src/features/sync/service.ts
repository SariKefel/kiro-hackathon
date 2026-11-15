import "server-only";
import type { CheckInOperation, SyncResponse } from "@/lib/validations/check-in";

// Shared application-service boundary for the HTTP API and future authenticated actions.
// Intentionally fail closed until Better Auth sessions and membership checks are wired.
export function synchronizeCheckIns(operations: CheckInOperation[]): SyncResponse {
  return {
    version: 1,
    acknowledgements: operations.map(({ id }) => ({
      id,
      status: "unavailable",
      message:
        "Demo Mode: remote delivery is unavailable. Your report remains saved on this device.",
    })),
  };
}
