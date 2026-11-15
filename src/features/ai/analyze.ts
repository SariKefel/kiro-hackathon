import { AiError } from "@/features/ai/errors";
import { buildInput, systemInstruction } from "@/features/ai/prompt";
import type { IncidentContext } from "@/features/ai/reports";
import {
  modelAnalysisSchema,
  priorityLevels,
  providerResponseSchema,
  type AiReport,
  type ModelAnalysis,
} from "@/features/ai/schema";

export type GenerateJson = (request: {
  system: string;
  input: string;
  schema: object;
}) => Promise<unknown>;

// Every report ID the model cites must be one we sent. Anything else is a fabricated reference.
function assertKnownReferences(analysis: ModelAnalysis, reports: AiReport[]) {
  const known = new Set(reports.map((report) => report.id));
  const cited = [
    ...analysis.keyObservations.flatMap((item) => item.reportIds),
    ...analysis.uncertainties.flatMap((item) => item.reportIds),
    ...analysis.priorities.flatMap((item) => item.reportIds),
  ];
  if (cited.some((id) => !known.has(id)))
    throw new AiError(
      "invalid_response",
      "The AI analysis referenced a report that does not exist.",
    );
}

const unique = (ids: string[]) => [...new Set(ids)];

// Summarizes and prioritizes in one model request, then validates the result.
export async function analyzeReports(input: {
  incident: IncidentContext;
  reports: AiReport[];
  generate: GenerateJson;
}): Promise<ModelAnalysis> {
  if (input.reports.length === 0)
    throw new AiError("no_reports", "There are no reports to analyze yet.");
  const raw = await input.generate({
    system: systemInstruction,
    input: buildInput(input.incident, input.reports),
    schema: providerResponseSchema,
  });
  const parsed = modelAnalysisSchema.safeParse(raw);
  if (!parsed.success)
    throw new AiError("invalid_response", "The AI analysis did not match the expected format.");
  const analysis = parsed.data;
  assertKnownReferences(analysis, input.reports);
  return {
    ...analysis,
    keyObservations: analysis.keyObservations.map((item) => ({
      ...item,
      reportIds: unique(item.reportIds),
    })),
    uncertainties: analysis.uncertainties.map((item) => ({
      ...item,
      reportIds: unique(item.reportIds),
    })),
    // Most urgent first. Array.sort is stable, so the model's order breaks ties.
    priorities: analysis.priorities
      .map((item) => ({ ...item, reportIds: unique(item.reportIds) }))
      .sort((a, b) => priorityLevels.indexOf(a.priority) - priorityLevels.indexOf(b.priority)),
  };
}
