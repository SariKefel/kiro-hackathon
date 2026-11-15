import type { Metadata } from "next";
import { DemoBanner } from "@/components/shared/demo-banner";
import { PersonnelDirectory } from "@/features/personnel/personnel-directory";
import { incident } from "@/features/incidents/demo-data";

export const metadata: Metadata = { title: "Personnel" };
export default async function PersonnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const team =
    typeof params.team === "string" && ["Alpha", "Bravo", "Charlie"].includes(params.team)
      ? params.team
      : "all";
  const status =
    typeof params.status === "string" &&
    ["safe", "needs_help", "unable_to_continue", "unknown"].includes(params.status)
      ? params.status
      : "all";
  const invalidIncident = params.incident && params.incident !== incident.id;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Personnel</h1>
        <p className="mt-2 muted">
          Know who is safe, who needs support, and who is still unaccounted for.
        </p>
      </div>
      <DemoBanner />
      {invalidIncident ? (
        <div className="panel p-8">
          <h2 className="section-heading">No personnel found for this incident</h2>
          <p className="mt-2 muted">
            Open the active incident to view its assigned response teams.
          </p>
        </div>
      ) : (
        <PersonnelDirectory
          key={`${search}-${team}-${status}`}
          initialSearch={search}
          initialTeam={team}
          initialStatus={status}
        />
      )}
    </div>
  );
}
