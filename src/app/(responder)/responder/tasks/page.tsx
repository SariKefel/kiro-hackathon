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
      <p className="text-sm text-muted-foreground">2 sample assignments for Alpha team</p>
      {tasks.map((task, index) => (
        <article
          data-tour="responder-tasks"
          key={task.id}
          aria-labelledby={`task-${task.id}`}
          className="overflow-hidden rounded-2xl bg-card shadow-[0_0_0_1px_var(--color-ink),var(--shadow-lift)]"
        >
          <div className="flex items-center gap-2 bg-chrome px-5 py-3 text-sm text-chrome-ink">
            <ClipboardList aria-hidden="true" className="size-4 text-chrome-signal" />
            <span className="font-medium">
              {task.status === "in_progress" ? "In progress" : "Assigned"}
            </span>
            <span className="figure-mono ml-auto text-chrome-muted">Task {index + 1} of 2</span>
          </div>
          <div className="p-5">
            <h2 id={`task-${task.id}`} className="text-lg">
              {task.title}
            </h2>
            <p className="mt-2 text-base leading-7 text-ink-2">{task.description}</p>
          </div>
          <dl className="grid grid-cols-2 divide-x divide-ink border-t border-ink text-sm">
            <div className="px-5 py-3">
              <dt className="text-ink-3">Priority</dt>
              <dd
                className={`mt-0.5 font-medium ${task.priority === "high" ? "text-caution" : ""}`}
              >
                {task.priority === "high" ? "High priority" : "Normal priority"}
              </dd>
            </div>
            <div className="px-5 py-3">
              <dt className="text-ink-3">Where</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-medium">
                <MapPin aria-hidden="true" className="size-3.5" />
                Seksyen 7, Shah Alam
              </dd>
            </div>
          </dl>
        </article>
      ))}
      <p className="text-sm leading-6 text-muted-foreground">
        Tasks are read-only demonstration assignments. Coordinate any changes through your team
        lead.
      </p>
    </>
  );
}
