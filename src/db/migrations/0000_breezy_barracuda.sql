CREATE TYPE "public"."incident_status" AS ENUM('active', 'monitoring', 'closed');--> statement-breakpoint
CREATE TYPE "public"."incident_type" AS ENUM('flood', 'storm', 'earthquake', 'other');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('admin', 'commander', 'responder');--> statement-breakpoint
CREATE TYPE "public"."safety_status" AS ENUM('safe', 'needs_help', 'unable_to_continue');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('normal', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('assigned', 'in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "incident_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"assigned_role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" "incident_type" NOT NULL,
	"status" "incident_status" DEFAULT 'active' NOT NULL,
	"location" text NOT NULL,
	"activated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "membership_role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personnel_check_ins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"incident_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"safety_status" "safety_status" NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"client_recorded_at" timestamp with time zone NOT NULL,
	"server_received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_in_message_length" CHECK (char_length("personnel_check_ins"."message") <= 500),
	CONSTRAINT "check_in_coordinates" CHECK (("personnel_check_ins"."latitude" IS NULL AND "personnel_check_ins"."longitude" IS NULL) OR ("personnel_check_ins"."latitude" IS NOT NULL AND "personnel_check_ins"."longitude" IS NOT NULL AND "personnel_check_ins"."latitude" BETWEEN -90 AND 90 AND "personnel_check_ins"."longitude" BETWEEN -180 AND 180))
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"assigned_to" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "task_status" DEFAULT 'assigned' NOT NULL,
	"priority" "task_priority" DEFAULT 'normal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "incident_assignments" ADD CONSTRAINT "incident_assignments_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_assignments" ADD CONSTRAINT "incident_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_check_ins" ADD CONSTRAINT "personnel_check_ins_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_check_ins" ADD CONSTRAINT "personnel_check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_check_ins" ADD CONSTRAINT "check_in_incident_org_fk" FOREIGN KEY ("incident_id","organization_id") REFERENCES "public"."incidents"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_check_ins" ADD CONSTRAINT "check_in_assignment_fk" FOREIGN KEY ("incident_id","user_id") REFERENCES "public"."incident_assignments"("incident_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_check_ins" ADD CONSTRAINT "check_in_membership_fk" FOREIGN KEY ("organization_id","user_id") REFERENCES "public"."organization_memberships"("organization_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "task_assignment_fk" FOREIGN KEY ("incident_id","assigned_to") REFERENCES "public"."incident_assignments"("incident_id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_incident_user_idx" ON "incident_assignments" USING btree ("incident_id","user_id");--> statement-breakpoint
CREATE INDEX "assignment_user_idx" ON "incident_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "incidents_org_status_idx" ON "incidents" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "incidents_id_org_idx" ON "incidents" USING btree ("id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_org_user_idx" ON "organization_memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "membership_user_idx" ON "organization_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "check_ins_incident_user_time_idx" ON "personnel_check_ins" USING btree ("incident_id","user_id","client_recorded_at");--> statement-breakpoint
CREATE INDEX "check_ins_org_received_idx" ON "personnel_check_ins" USING btree ("organization_id","server_received_at");--> statement-breakpoint
CREATE INDEX "tasks_assignee_status_idx" ON "tasks" USING btree ("assigned_to","status");--> statement-breakpoint
CREATE INDEX "tasks_incident_idx" ON "tasks" USING btree ("incident_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");