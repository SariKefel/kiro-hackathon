import { z } from "zod";
import type { SafetyStatus } from "@/types/domain";

// The client sends only an incident ID. Everything else is selected on the server.
export const analyzeRequestSchema = z.object({ incidentId: z.uuid() }).strict();

export const priorityLevels = ["critical", "high", "medium", "low"] as const;
export type PriorityLevel = (typeof priorityLevels)[number];

const reportIds = z.array(z.string().min(1).max(64)).max(20);
const referencedText = z.object({ text: z.string().min(1).max(400), reportIds });

// What the model must return. Bounds are checked here, not in the provider schema.
export const modelAnalysisSchema = z.object({
  summary: z.string().min(1).max(1200),
  keyObservations: z
    .array(z.object({ text: z.string().min(1).max(400), reportIds: reportIds.min(1) }))
    .max(8),
  uncertainties: z.array(referencedText).max(6),
  priorities: z
    .array(
      z.object({
        priority: z.enum(priorityLevels),
        title: z.string().min(1).max(120),
        reason: z.string().min(1).max(400),
        reportIds: reportIds.min(1),
        suggestedAction: z.string().min(1).max(300),
        uncertain: z.boolean(),
      }),
    )
    .max(8),
});
export type ModelAnalysis = z.infer<typeof modelAnalysisSchema>;

// The same shape expressed as JSON Schema for the provider's structured output.
const referenced = {
  type: "object",
  properties: {
    text: { type: "string" },
    reportIds: { type: "array", items: { type: "string" } },
  },
  required: ["text", "reportIds"],
};
export const providerResponseSchema = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "Two to four sentences describing the situation using only the reports.",
    },
    keyObservations: { type: "array", items: referenced },
    uncertainties: {
      type: "array",
      items: referenced,
      description: "Gaps, unverified claims, or conflicts between reports.",
    },
    priorities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          priority: { type: "string", enum: [...priorityLevels] },
          title: { type: "string" },
          reason: { type: "string" },
          reportIds: { type: "array", items: { type: "string" } },
          suggestedAction: { type: "string" },
          uncertain: { type: "boolean" },
        },
        required: ["priority", "title", "reason", "reportIds", "suggestedAction", "uncertain"],
      },
    },
  },
  required: ["summary", "keyObservations", "uncertainties", "priorities"],
};

// A report as the analysis sees it. It deliberately has no name, email, or user ID.
export interface AiReport {
  id: string;
  status: SafetyStatus;
  team: string;
  message: string;
  recordedAt: string;
}

export interface AnalysisResult extends ModelAnalysis {
  // True while reports come from fictional sample data instead of server-persisted reports.
  demo: boolean;
  generatedAt: string;
  model: string;
  cached: boolean;
  reportsAnalyzed: number;
  reports: AiReport[];
}
