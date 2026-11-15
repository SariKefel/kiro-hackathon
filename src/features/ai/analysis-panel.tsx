"use client";
import { useRef, useState } from "react";
import { AlertTriangle, LoaderCircle, OctagonAlert, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";
import type { AnalysisResult, PriorityLevel } from "@/features/ai/schema";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: AnalysisResult };

const priorityStyle: Record<PriorityLevel, { label: string; className: string }> = {
  critical: {
    label: "Critical",
    className: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  },
  high: {
    label: "High",
    className: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  low: { label: "Low", className: "bg-secondary text-secondary-foreground" },
};
const statusLabel = {
  safe: "Safe",
  needs_help: "Needs help",
  unable_to_continue: "Unable to continue",
} as const;

function ReportRefs({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
      Source reports:
      {ids.map((id) => (
        <a
          key={id}
          href={`#ai-report-${id}`}
          className="rounded bg-secondary px-1.5 py-0.5 font-mono text-primary underline-offset-2 hover:underline dark:text-teal-300"
        >
          {id}
        </a>
      ))}
    </span>
  );
}

export function AiAnalysisPanel({ incidentId }: { incidentId: string }) {
  const [state, setState] = useState<State>({ status: "idle" });
  const running = useRef(false);

  async function generate() {
    if (running.current) return;
    if (!navigator.onLine) {
      setState({
        status: "error",
        message:
          "AI analysis needs an internet connection. The rest of the command center still works.",
      });
      return;
    }
    running.current = true;
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(35_000),
        body: JSON.stringify({ incidentId }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(body?.error?.message ?? "AI analysis is unavailable right now.");
      setState({ status: "done", result: body as AnalysisResult });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      setState({
        status: "error",
        message: timedOut
          ? "The analysis took too long. Try again shortly."
          : error instanceof Error && error.message
            ? error.message
            : "AI analysis is unavailable right now.",
      });
    } finally {
      running.current = false;
    }
  }

  const loading = state.status === "loading";
  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="ai-analysis-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="ai-analysis-heading" className="section-heading flex items-center gap-2">
            <Sparkles className="size-4" />
            AI situation analysis
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-6 text-muted-foreground">
            Summarizes the incident reports and suggests where to look first. It only advises. You
            decide, and nothing is dispatched or changed.
          </p>
        </div>
        <Button onClick={generate} disabled={loading} className="min-h-11">
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles />}
          {loading ? "Analyzing..." : "Generate AI Analysis"}
        </Button>
      </div>
      <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200">
        AI-generated analysis of fictional demonstration data. It is not verified live incident
        information.
      </p>
      <div role="status" aria-live="polite" aria-busy={loading} className="mt-4">
        {loading && (
          <p className="text-xs text-muted-foreground">
            Reading the reports. This takes a few seconds.
          </p>
        )}
        {state.status === "idle" && (
          <p className="text-xs text-muted-foreground">
            Select Generate AI Analysis to analyze the sample reports.
          </p>
        )}
      </div>
      {state.status === "error" && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {state.message}
        </p>
      )}
      {state.status === "done" && <AnalysisResultView result={state.result} />}
    </section>
  );
}

function AnalysisResultView({ result }: { result: AnalysisResult }) {
  return (
    <div className="mt-2 space-y-6">
      <p className="text-[11px] leading-5 text-muted-foreground">
        {result.reportsAnalyzed} {result.reportsAnalyzed === 1 ? "report" : "reports"} analyzed
        {result.demo ? " (sample data)" : ""} · Generated {formatDate(result.generatedAt)},{" "}
        {formatTime(result.generatedAt)} MYT{result.cached ? " · Reused recent analysis" : ""}
      </p>
      <div>
        <h3 className="text-xs font-semibold">Situation summary</h3>
        <p className="mt-2 text-sm leading-7">{result.summary}</p>
      </div>
      {result.priorities.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-xs font-semibold">
            <ShieldAlert className="size-4" />
            Suggested attention order
          </h3>
          <ol className="mt-3 space-y-3">
            {result.priorities.map((item, index) => {
              const style = priorityStyle[item.priority];
              return (
                <li key={index} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-1 text-[11px] font-semibold ${style.className}`}
                    >
                      {style.label} priority
                    </span>
                    {item.uncertain && (
                      <span className="flex items-center gap-1 rounded border border-amber-600 px-2 py-1 text-[11px] font-medium text-amber-900 dark:text-amber-200">
                        <AlertTriangle className="size-3" />
                        Uncertain
                      </span>
                    )}
                    <h4 className="text-sm font-semibold">{item.title}</h4>
                  </div>
                  <p className="mt-2 text-xs leading-6">{item.reason}</p>
                  <p className="mt-2 text-xs leading-6">
                    <span className="font-semibold">Suggested next step for you to consider: </span>
                    {item.suggestedAction}
                  </p>
                  <ReportRefs ids={item.reportIds} />
                </li>
              );
            })}
          </ol>
        </div>
      )}
      {result.keyObservations.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold">Key observations</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-xs leading-6">
            {result.keyObservations.map((item, index) => (
              <li key={index}>
                {item.text}
                <ReportRefs ids={item.reportIds} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.uncertainties.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-xs font-semibold">
            <OctagonAlert className="size-4" />
            Uncertainties and conflicts
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-xs leading-6">
            {result.uncertainties.map((item, index) => (
              <li key={index}>
                {item.text}
                <ReportRefs ids={item.reportIds} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h3 className="text-xs font-semibold">Original reports analyzed</h3>
        <ul className="mt-2 divide-y rounded-lg border">
          {result.reports.map((report) => (
            <li key={report.id} id={`ai-report-${report.id}`} className="scroll-mt-24 p-3 text-xs">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[10px] text-muted-foreground">{report.id}</span>
                <span className="font-semibold">{statusLabel[report.status]}</span>
                <span className="text-muted-foreground">{report.team} team</span>
                <time
                  className="ml-auto text-[10px] text-muted-foreground"
                  dateTime={report.recordedAt}
                >
                  {formatTime(report.recordedAt)} MYT
                </time>
              </div>
              <p className="mt-1 leading-6">{report.message || "No message."}</p>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[10px] leading-5 text-muted-foreground">
        Generated by {result.model}. AI can make mistakes and the reports are unverified. Check the
        original reports before acting.
      </p>
    </div>
  );
}
