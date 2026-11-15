import type {
  Incident,
  IncidentAssignment,
  Organization,
  OrganizationMembership,
  Personnel,
  PersonnelCheckIn,
  Task,
} from "@/types/domain";

export const organization: Organization = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Selangor Response Network",
  createdAt: "2026-01-01T00:00:00Z",
};
export const demoSnapshot = "2026-11-15T00:40:00Z";
export const incident: Incident = {
  id: "20000000-0000-4000-8000-000000000001",
  organizationId: organization.id,
  title: "Klang Valley flood response",
  description:
    "Coordinated evacuation and welfare checks following sustained rainfall along the Klang River. Teams are supporting residents in low-lying areas around Shah Alam.",
  type: "flood",
  status: "active",
  location: "Shah Alam, Selangor",
  activatedAt: "2026-11-14T14:00:00Z",
  createdAt: "2026-11-14T14:00:00Z",
};
export const commander = { name: "Nadia Rahman", role: "Incident commander", initials: "NR" };
const people: Array<[string, string, string, Personnel["status"], string | null, string?]> = [
  [
    "Amir Hassan",
    "Alpha",
    "Field responder",
    "safe",
    "00:37",
    "Evacuation point secured. All clear.",
  ],
  [
    "Mei Ling Tan",
    "Bravo",
    "Medical officer",
    "safe",
    "00:35",
    "Medical station ready at SK Seksyen 7.",
  ],
  [
    "Ravi Kumar",
    "Alpha",
    "Rescue specialist",
    "needs_help",
    "00:32",
    "Access road flooded. Need boat support near Jalan Plumbum.",
  ],
  [
    "Siti Aisyah",
    "Charlie",
    "Team lead",
    "safe",
    "00:30",
    "Charlie team accounted for at the shelter.",
  ],
  [
    "Daniel Lee",
    "Bravo",
    "Field responder",
    "unable_to_continue",
    "00:28",
    "Ankle injury. At the Seksyen 7 staging point.",
  ],
  ["Farah Ismail", "Charlie", "Logistics officer", "safe", "00:25"],
  ["Jason Wong", "Alpha", "Field responder", "unknown", null],
  ["Priya Nair", "Bravo", "Medical officer", "safe", "00:22"],
  ["Hakim Zain", "Charlie", "Field responder", "unknown", "2026-11-14T15:10:00Z"],
  ["Nur Izzati", "Alpha", "Team lead", "safe", "00:18"],
];
export const personnel: Personnel[] = people.map(
  ([name, team, role, status, time, message], index) => ({
    id: `demo-user-${index + 1}`,
    name,
    email: `responder${index + 1}@example.test`,
    team,
    role,
    status,
    message,
    lastCheckIn: time ? (time.includes("T") ? time : `2026-11-15T${time}:00Z`) : null,
    createdAt: organization.createdAt,
  }),
);
export const demoResponder = personnel[0];
export const memberships: OrganizationMembership[] = personnel.map((p, i) => ({
  id: `demo-membership-${i + 1}`,
  organizationId: organization.id,
  userId: p.id,
  role: "responder",
}));
export const assignments: IncidentAssignment[] = personnel.map((p, i) => ({
  id: `demo-assignment-${i + 1}`,
  incidentId: incident.id,
  userId: p.id,
  assignedRole: p.role,
}));
export const checkIns: PersonnelCheckIn[] = personnel
  .filter((p) => p.status !== "unknown")
  .map((p, i) => ({
    id: `demo-check-in-${i + 1}`,
    organizationId: organization.id,
    incidentId: incident.id,
    userId: p.id,
    safetyStatus: p.status as PersonnelCheckIn["safetyStatus"],
    message: p.message ?? "",
    latitude: null,
    longitude: null,
    clientRecordedAt: p.lastCheckIn!,
    serverReceivedAt: p.lastCheckIn!,
    createdAt: p.lastCheckIn!,
  }));
export const tasks: Task[] = [
  {
    id: "demo-task-1",
    incidentId: incident.id,
    assignedTo: demoResponder.id,
    title: "Welfare checks in Seksyen 7",
    description:
      "Check on residents along Jalan Kristal. Report access restrictions and anyone needing evacuation to Alpha team lead.",
    status: "in_progress",
    priority: "high",
    createdAt: "2026-11-14T23:00:00Z",
  },
  {
    id: "demo-task-2",
    incidentId: incident.id,
    assignedTo: demoResponder.id,
    title: "Deliver supplies to the relief centre",
    description:
      "Coordinate with logistics at SK Seksyen 7 for drinking water and first-aid supplies after welfare checks.",
    status: "assigned",
    priority: "normal",
    createdAt: "2026-11-15T00:00:00Z",
  },
];
export function getAccountability() {
  return {
    total: personnel.length,
    safe: personnel.filter((p) => p.status === "safe").length,
    assistance: personnel.filter(
      (p) => p.status === "needs_help" || p.status === "unable_to_continue",
    ).length,
    unknown: personnel.filter((p) => p.status === "unknown").length,
  };
}
