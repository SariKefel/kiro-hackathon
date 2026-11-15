import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const membershipRole = pgEnum("membership_role", ["admin", "commander", "responder"]);
export const incidentType = pgEnum("incident_type", ["flood", "storm", "earthquake", "other"]);
export const incidentStatus = pgEnum("incident_status", ["active", "monitoring", "closed"]);
export const safetyStatus = pgEnum("safety_status", ["safe", "needs_help", "unable_to_continue"]);
export const taskStatus = pgEnum("task_status", ["assigned", "in_progress", "completed"]);
export const taskPriority = pgEnum("task_priority", ["normal", "high", "critical"]);
const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});
// Text identifiers accommodate Better Auth's user IDs. Credentials belong to Better Auth.
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);
export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    role: membershipRole("role").notNull(),
  },
  (t) => [
    unique("membership_org_user_idx").on(t.organizationId, t.userId),
    index("membership_user_idx").on(t.userId),
  ],
);
export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    type: incidentType("type").notNull(),
    status: incidentStatus("status").default("active").notNull(),
    location: text("location").notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("incidents_org_status_idx").on(t.organizationId, t.status),
    unique("incidents_id_org_idx").on(t.id, t.organizationId),
  ],
);
export const incidentAssignments = pgTable(
  "incident_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    incidentId: uuid("incident_id")
      .notNull()
      .references(() => incidents.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    assignedRole: text("assigned_role").notNull(),
  },
  (t) => [
    unique("assignment_incident_user_idx").on(t.incidentId, t.userId),
    index("assignment_user_idx").on(t.userId),
  ],
);
export const personnelCheckIns = pgTable(
  "personnel_check_ins",
  {
    // The operation ID is the primary key, so a retry cannot insert the same report twice.
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    incidentId: uuid("incident_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    safetyStatus: safetyStatus("safety_status").notNull(),
    message: text("message").notNull().default(""),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    clientRecordedAt: timestamp("client_recorded_at", { withTimezone: true }).notNull(),
    serverReceivedAt: timestamp("server_received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.incidentId, t.organizationId],
      foreignColumns: [incidents.id, incidents.organizationId],
      name: "check_in_incident_org_fk",
    }),
    foreignKey({
      columns: [t.incidentId, t.userId],
      foreignColumns: [incidentAssignments.incidentId, incidentAssignments.userId],
      name: "check_in_assignment_fk",
    }),
    foreignKey({
      columns: [t.organizationId, t.userId],
      foreignColumns: [organizationMemberships.organizationId, organizationMemberships.userId],
      name: "check_in_membership_fk",
    }),
    index("check_ins_incident_user_time_idx").on(t.incidentId, t.userId, t.clientRecordedAt),
    index("check_ins_org_received_idx").on(t.organizationId, t.serverReceivedAt),
    check("check_in_message_length", sql`char_length(${t.message}) <= 500`),
    check(
      "check_in_coordinates",
      sql`(${t.latitude} IS NULL AND ${t.longitude} IS NULL) OR (${t.latitude} IS NOT NULL AND ${t.longitude} IS NOT NULL AND ${t.latitude} BETWEEN -90 AND 90 AND ${t.longitude} BETWEEN -180 AND 180)`,
    ),
  ],
);
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    incidentId: uuid("incident_id")
      .notNull()
      .references(() => incidents.id),
    assignedTo: text("assigned_to")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: taskStatus("status").default("assigned").notNull(),
    priority: taskPriority("priority").default("normal").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("tasks_assignee_status_idx").on(t.assignedTo, t.status),
    index("tasks_incident_idx").on(t.incidentId),
    foreignKey({
      columns: [t.incidentId, t.assignedTo],
      foreignColumns: [incidentAssignments.incidentId, incidentAssignments.userId],
      name: "task_assignment_fk",
    }),
  ],
);
