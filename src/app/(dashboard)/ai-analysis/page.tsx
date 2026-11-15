import type { Metadata } from "next";
import { DemoBanner } from "@/components/shared/demo-banner";
import { AiAnalysisPanel } from "@/features/ai/analysis-panel";
import { incident } from "@/features/incidents/demo-data";

export const metadata: Metadata = { title: "AI analysis" };
export default function AiAnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">AI analysis</h1>
        <p className="mt-2 muted">
          An advisory summary of {incident.title} reports, with suggested attention priorities.
        </p>
      </div>
      <DemoBanner />
      <AiAnalysisPanel incidentId={incident.id} />
    </div>
  );
}
