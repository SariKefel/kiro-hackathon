export type AiErrorCode =
  | "not_configured"
  | "rate_limited"
  | "timeout"
  | "unavailable"
  | "invalid_response"
  | "no_reports"
  | "not_found";

// HTTP status for each failure, shared by the route handler.
export const aiErrorStatus: Record<AiErrorCode, number> = {
  not_configured: 503,
  rate_limited: 429,
  timeout: 504,
  unavailable: 502,
  invalid_response: 502,
  no_reports: 422,
  not_found: 404,
};

// Messages are safe to show to users. They never contain provider details or credentials.
export class AiError extends Error {
  constructor(
    readonly code: AiErrorCode,
    message: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "AiError";
  }
}
