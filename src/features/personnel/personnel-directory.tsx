"use client";
import { useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { personnel, incident } from "@/features/incidents/demo-data";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, initials } from "@/lib/utils";

import { useLocationAssignments } from "@/features/incidents/assignment-store";
import { responseLocations } from "@/features/incidents/response-locations";

export function PersonnelDirectory({
  initialSearch = "",
  initialTeam = "all",
  initialStatus = "all",
}: {
  initialSearch?: string;
  initialTeam?: string;
  initialStatus?: string;
}) {
  const locationAssignments = useLocationAssignments();
  const [search, setSearch] = useState(initialSearch);
  const [team, setTeam] = useState(initialTeam);
  const [status, setStatus] = useState(initialStatus);
  const filtered = useMemo(
    () =>
      personnel.filter(
        (p) =>
          `${p.name} ${p.role} ${p.team}`.toLowerCase().includes(search.toLowerCase()) &&
          (team === "all" || p.team === team) &&
          (status === "all" || p.status === status),
      ),
    [search, team, status],
  );
  function reset() {
    setSearch("");
    setTeam("all");
    setStatus("all");
  }
  const hasFilters = search || team !== "all" || status !== "all";
  return (
    <section className="panel overflow-hidden">
      <div
        data-tour="personnel-filters"
        className="flex flex-wrap items-center gap-3 border-b p-4 sm:p-5"
      >
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search personnel by name, team, or role"
            placeholder="Search name, team, or role..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="field pl-9"
          />
        </div>
        <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" />
        <select
          aria-label="Filter by team"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="field w-auto"
        >
          <option value="all">All teams</option>
          {["Alpha", "Bravo", "Charlie"].map((t) => (
            <option key={t} value={t}>
              {t} team
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by safety status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="field w-auto"
        >
          <option value="all">All statuses</option>
          <option value="safe">Safe</option>
          <option value="needs_help">Needs help</option>
          <option value="unable_to_continue">Unable to continue</option>
          <option value="unknown">Unknown</option>
        </select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-secondary/40 px-5 py-3 text-[11px] text-muted-foreground">
        <span role="status">
          {filtered.length} of {personnel.length} personnel
        </span>
        <span>Klang Valley flood response</span>
      </div>
      <div className="hidden grid-cols-[1.4fr_.65fr_1fr_1.1fr_.85fr_20px] gap-3 border-b px-5 py-3 text-[10px] font-medium text-muted-foreground lg:grid">
        <span>Personnel</span>
        <span>Team</span>
        <span>Assigned role</span>
        <span>Reported status</span>
        <span>Last confirmation</span>
        <span className="sr-only">Details</span>
      </div>
      <div data-tour="personnel-records" className="divide-y">
        {filtered.map((p) => (
          <details className="group" key={p.id}>
            <summary className="grid cursor-pointer list-none items-center gap-3 px-5 py-4 hover:bg-secondary/40 sm:grid-cols-[1.3fr_1fr_auto] lg:grid-cols-[1.4fr_.65fr_1fr_1.1fr_.85fr_20px] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-muted-foreground">
                  {initials(p.name)}
                </span>
                <span>
                  <span className="block text-xs font-semibold">{p.name}</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground lg:hidden">
                    {p.team} team · {p.role}
                  </span>
                  <span className="mt-1 hidden text-[10px] text-muted-foreground lg:block">
                    Demo responder
                  </span>
                </span>
              </span>
              <span className="hidden text-xs text-muted-foreground lg:block">{p.team}</span>
              <span className="hidden text-xs text-muted-foreground lg:block">{p.role}</span>
              <span>
                <StatusBadge status={p.status} />
              </span>
              <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {p.lastCheckIn ? `${formatTime(p.lastCheckIn)} MYT` : "No check-in"}
                <ChevronDown className="ml-auto size-3.5 transition-transform group-open:rotate-180 lg:hidden" />
              </span>
              <ChevronDown className="hidden size-3.5 text-muted-foreground transition-transform group-open:rotate-180 lg:block" />
            </summary>
            <div className="mx-5 mb-5 rounded-lg border bg-secondary/30 p-4 text-xs leading-6">
              <p className="font-medium">Latest report</p>
              <p className="text-muted-foreground">
                {p.status === "unknown"
                  ? p.lastCheckIn
                    ? "Previous confirmation is outdated. A new safety check-in is needed."
                    : "No safety report received for this incident."
                  : (p.message ?? "No additional message provided.")}
              </p>
              <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Incident</dt>
                  <dd>{incident.title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last confirmed check-in</dt>
                  <dd>
                    {p.lastCheckIn
                      ? `${formatDate(p.lastCheckIn)}, ${formatTime(p.lastCheckIn)} MYT (sample)`
                      : "Never confirmed"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Demo contact</dt>
                  <dd>{p.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Demo response assignment</dt>
                  <dd>
                    {responseLocations.find((place) => place.id === locationAssignments[p.id])
                      ?.name ?? "Unassigned"}
                  </dd>
                </div>
              </dl>
            </div>
          </details>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="px-5 py-16 text-center">
          <Users className="mx-auto mb-4 size-8 text-muted-foreground" />
          <h2 className="text-sm font-semibold">No personnel match your filters</h2>
          <p className="mb-5 mt-2 muted">Try a different name, team, or safety status.</p>
          <Button variant="outline" onClick={reset}>
            Clear filters
          </Button>
        </div>
      )}
      <p className="border-t px-5 py-3 text-[10px] leading-5 text-muted-foreground">
        Select a person to review their latest report. Unknown means missing or outdated
        confirmation, not a submitted status.
      </p>
    </section>
  );
}
