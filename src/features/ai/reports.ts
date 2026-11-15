import { checkIns, incident, personnel } from "@/features/incidents/demo-data";
import type { AiReport } from "@/features/ai/schema";

export interface IncidentContext {
  id: string;
  title: string;
  type: string;
  status: string;
  location: string;
}

// The analysis reads reports through this interface. When check-ins are persisted on the
// server, add a database-backed source with the same shape and swap it in service.ts.
export interface ReportSource {
  // "demo" results are labeled as analysis of fictional sample data.
  kind: "demo" | "live";
  getIncident(incidentId: string): Promise<IncidentContext | null>;
  listReports(incidentId: string): Promise<AiReport[]>;
}

export const MAX_REPORTS = 50;

// Removes contact details a responder might type into a message before it leaves the server.
export function redact(message: string) {
  return message
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[removed]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[removed]")
    .trim();
}

const teamByUser = new Map(personnel.map((p) => [p.id, p.team]));

export const demoReportSource: ReportSource = {
  kind: "demo",
  async getIncident(incidentId) {
    if (incidentId !== incident.id) return null;
    return {
      id: incident.id,
      title: incident.title,
      type: incident.type,
      status: incident.status,
      location: incident.location,
    };
  },
  async listReports(incidentId) {
    return checkIns
      .filter((report) => report.incidentId === incidentId)
      .sort((a, b) => b.clientRecordedAt.localeCompare(a.clientRecordedAt))
      .slice(0, MAX_REPORTS)
      .map((report) => ({
        id: report.id,
        status: report.safetyStatus,
        team: teamByUser.get(report.userId) ?? "Unassigned",
        message: redact(report.message),
        recordedAt: report.clientRecordedAt,
      }));
  },
};
