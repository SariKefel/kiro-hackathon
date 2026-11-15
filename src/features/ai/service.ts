import "server-only";
import { createHash } from "node:crypto";
import { AiError } from "@/features/ai/errors";
import { analyzeReports } from "@/features/ai/analyze";
import { DEFAULT_GEMINI_MODEL, generateJson } from "@/features/ai/gemini";
import { createRateLimiter, createResultCache } from "@/features/ai/guard";
import { demoReportSource, type ReportSource } from "@/features/ai/reports";
import type { AnalysisResult } from "@/features/ai/schema";

// Per visitor: 5 analyses a minute. Across the app: 20 model requests an hour.
// Identical reports reuse a result for 5 minutes without calling the model.
const perClient = createRateLimiter({ limit: 5, windowMs: 60_000 });
const upstreamBudget = createRateLimiter({ limit: 20, windowMs: 3_600_000 });
const cache = createResultCache<AnalysisResult>({ ttlMs: 300_000 });

// Phase 1 reads fictional sample reports. Replace this with a database-backed ReportSource
// once check-ins are persisted and authorization is in place.
const source: ReportSource = demoReportSource;

export async function runIncidentAnalysis(incidentId: string, clientKey: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new AiError("not_configured", "AI analysis is not configured on this server.");
  const limited = perClient.take(clientKey);
  if (!limited.ok)
    throw new AiError(
      "rate_limited",
      "Too many analysis requests. Please wait a moment and try again.",
      limited.retryAfterSeconds,
    );
  const incident = await source.getIncident(incidentId);
  if (!incident) throw new AiError("not_found", "Incident not found.");
  const reports = await source.listReports(incidentId);
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ model, incident, reports }))
    .digest("hex");

  const { value, cached } = await cache.run(fingerprint, async () => {
    const budget = upstreamBudget.take("model");
    if (!budget.ok)
      throw new AiError(
        "rate_limited",
        "The AI analysis limit has been reached. Please try again later.",
        budget.retryAfterSeconds,
      );
    const analysis = await analyzeReports({
      incident,
      reports,
      generate: (request) => generateJson({ ...request, apiKey, model }),
    });
    return {
      ...analysis,
      demo: source.kind === "demo",
      generatedAt: new Date().toISOString(),
      model,
      cached: false,
      reportsAnalyzed: reports.length,
      reports,
    };
  });
  return { ...value, cached };
}
