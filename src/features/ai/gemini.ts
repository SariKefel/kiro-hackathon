import { AiError } from "@/features/ai/errors";

// Gemini Interactions API, the endpoint Google recommends for new work. The revision is pinned
// so a future API change cannot alter responses silently.
export const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
export const GEMINI_API_REVISION = "2026-05-20";
// Stable Gemini Flash model at the time of writing. Override with GEMINI_MODEL.
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;
export interface GeminiRequest {
  apiKey: string;
  model?: string;
  system: string;
  input: string;
  schema: object;
  timeoutMs?: number;
}

function extractText(body: unknown): string | null {
  const steps = (body as { steps?: unknown })?.steps;
  if (!Array.isArray(steps)) return null;
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    const step = steps[i] as { type?: unknown; content?: unknown };
    if (step?.type !== "model_output" || !Array.isArray(step.content)) continue;
    const text = step.content
      .filter((part): part is { type: "text"; text: string } => {
        const candidate = part as { type?: unknown; text?: unknown };
        return candidate?.type === "text" && typeof candidate.text === "string";
      })
      .map((part) => part.text)
      .join("");
    if (text) return text;
  }
  return null;
}

function parseJsonText(text: string): unknown {
  const unfenced = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(unfenced);
}

// Sends one structured request and returns the parsed JSON. It does not trust or validate the
// content. Callers validate it against their own schema.
export async function generateJson(
  request: GeminiRequest,
  fetchImpl: FetchLike = fetch,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImpl(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "x-goog-api-key": request.apiKey,
        "Content-Type": "application/json",
        "Api-Revision": GEMINI_API_REVISION,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(request.timeoutMs ?? 25_000),
      body: JSON.stringify({
        model: request.model ?? DEFAULT_GEMINI_MODEL,
        system_instruction: request.system,
        input: request.input,
        // Do not keep the conversation on the provider side.
        store: false,
        response_format: { type: "text", mime_type: "application/json", schema: request.schema },
        generation_config: { max_output_tokens: 8192 },
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError")
      throw new AiError("timeout", "The AI service took too long to respond. Try again shortly.");
    throw new AiError("unavailable", "The AI service could not be reached. Try again shortly.");
  }
  if (response.status === 429)
    throw new AiError("rate_limited", "The AI service is busy. Try again in a minute.", 60);
  if (!response.ok) {
    // Log the status only. The body can echo request content.
    console.error(`Gemini request failed with HTTP ${response.status}.`);
    throw new AiError("unavailable", "The AI service is unavailable right now.");
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AiError("invalid_response", "The AI service returned an unreadable response.");
  }
  const status = (body as { status?: unknown })?.status;
  if (status !== undefined && status !== "completed")
    throw new AiError("unavailable", "The AI service did not finish the analysis.");
  const text = extractText(body);
  if (!text) throw new AiError("invalid_response", "The AI service returned no analysis.");
  try {
    return parseJsonText(text);
  } catch {
    throw new AiError("invalid_response", "The AI service returned malformed analysis.");
  }
}
