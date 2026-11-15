import { NextResponse } from "next/server";
import { AiError, aiErrorStatus } from "@/features/ai/errors";
import { analyzeRequestSchema } from "@/features/ai/schema";
import { runIncidentAnalysis } from "@/features/ai/service";

export const maxDuration = 30;

const noStore = { "Cache-Control": "no-store" };
const fail = (code: string, message: string, status: number, headers?: HeadersInit) =>
  NextResponse.json({ error: { code, message } }, { status, headers: { ...noStore, ...headers } });

export async function POST(request: Request) {
  // Only this application's own pages may call the paid endpoint from a browser.
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin)
    return fail("forbidden", "Cross-origin requests are not allowed.", 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return fail("invalid_request", "Expected application/json.", 415);
  const text = await request.text();
  if (text.length > 1024) return fail("invalid_request", "Request is too large.", 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return fail("invalid_request", "Invalid JSON request.", 400);
  }
  // The client names an incident and nothing else. Report text never comes from the browser.
  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) return fail("invalid_request", "A valid incident ID is required.", 400);

  const clientKey =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  try {
    const result = await runIncidentAnalysis(parsed.data.incidentId, clientKey);
    return NextResponse.json(result, { headers: noStore });
  } catch (error) {
    if (error instanceof AiError)
      return fail(
        error.code,
        error.message,
        aiErrorStatus[error.code],
        error.retryAfterSeconds ? { "Retry-After": String(error.retryAfterSeconds) } : undefined,
      );
    console.error("Unexpected AI analysis failure.");
    return fail("unavailable", "AI analysis is unavailable right now.", 500);
  }
}
