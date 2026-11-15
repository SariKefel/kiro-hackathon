import type { Metadata } from "next";
import { ClipboardList, MapPin } from "lucide-react";
import { tasks } from "@/features/incidents/demo-data";
import { DemoBanner } from "@/components/shared/demo-banner";
import { ConnectionStatus } from "@/components/shared/connection-status";

export const metadata: Metadata = { title: "My tasks" };
export default function TasksPage() {
  return (
    <>
      <div>
        <h1 className="page-title">My tasks</h1>
        <p className="mt-2 muted">Stay focused on your next step.</p>
      </div>
      <DemoBanner responder />
      <ConnectionStatus />
      <p className="text-xs text-muted-foreground">2 sample assignments · Alpha team</p>
      {tasks.map((task) => (
        <article data-tour="responder-tasks" key={task.id} className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium">
              {task.status === "in_progress" ? "In progress" : "Assigned"}
            </span>
            <span className="ml-auto rounded bg-secondary px-2 py-1 text-[10px]">
              {task.priority === "high" ? "High priority" : "Normal priority"}
            </span>
          </div>
          <h2 className="text-base font-semibold tracking-tight">{task.title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{task.description}</p>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            Seksyen 7, Shah Alam
          </p>
        </article>
      ))}
      <p className="text-xs leading-6 text-muted-foreground">
        Tasks are read-only demonstration assignments. Coordinate any changes through your team
        lead.
      </p>
    </>
  );
}
