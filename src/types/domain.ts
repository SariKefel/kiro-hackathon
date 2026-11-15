export const safetyStatuses = ["safe", "needs_help", "unable_to_continue"] as const;
export type SafetyStatus = (typeof safetyStatuses)[number];
export type AccountabilityStatus = SafetyStatus | "unknown";
export type MembershipRole = "commander" | "responder" | "admin";

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
}
export interface Incident {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  type: "flood" | "storm" | "earthquake" | "other";
  status: "active" | "monitoring" | "closed";
  location: string;
  activatedAt: string;
  createdAt: string;
}
export interface IncidentAssignment {
  id: string;
  incidentId: string;
  userId: string;
  assignedRole: string;
}
export interface PersonnelCheckIn {
  id: string;
  organizationId: string;
  incidentId: string;
  userId: string;
  safetyStatus: SafetyStatus;
  message: string;
  latitude: number | null;
  longitude: number | null;
  clientRecordedAt: string;
  serverReceivedAt: string | null;
  createdAt: string;
}
export interface Task {
  id: string;
  incidentId: string;
  assignedTo: string;
  title: string;
  description: string;
  status: "assigned" | "in_progress" | "completed";
  priority: "normal" | "high" | "critical";
  createdAt: string;
}
export interface Personnel extends User {
  team: string;
  role: string;
  status: AccountabilityStatus;
  lastCheckIn: string | null;
  message?: string;
}
