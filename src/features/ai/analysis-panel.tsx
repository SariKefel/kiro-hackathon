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
    className: "bg-help-soft text-help",
  },
  high: {
    label: "High",
    className: "bg-caution-soft text-caution",
  },
  medium: {
    label: "Medium",
    className: "bg-info-soft text-info",
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
    <span className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      Source reports:
      {ids.map((id) => (
        <a
          key={id}
          href={`#ai-report-${id}`}
          className="figure-mono inline-flex min-h-8 items-center rounded-sm border border-rule-2 px-1.5 text-xs text-signal-text underline-offset-2 hover:underline active:bg-paper-3"
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
    <section className="min-w-0" aria-labelledby="ai-analysis-heading">
      <div className="ruled flex flex-wrap items-start justify-between gap-4 pt-4">
        <div className="max-w-2xl">
          <h2 id="ai-analysis-heading" className="flex items-center gap-2 text-xl">
            <Sparkles aria-hidden="true" className="size-5 text-signal-text" />
            AI situation analysis
          </h2>
          <p className="mt-2 text-base leading-7 text-ink-2">
            Summarizes the incident reports and suggests where to look first. It only advises. You
            decide, and nothing is dispatched or changed.
          </p>
          <p className="mt-3 border-l-2 border-caution-fill pl-3 text-sm leading-6 text-caution">
            AI-generated analysis of fictional demonstration data. It is not verified live incident
            information.
          </p>
        </div>
        <Button onClick={generate} disabled={loading} size="lg">
          {loading ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" />
          )}
          {loading ? "Analyzing…" : "Generate AI Analysis"}
        </Button>
      </div>
      <div role="status" aria-live="polite" aria-busy={loading} className="mt-6">
        {loading && (
          <div className="space-y-3" aria-hidden="true">
            <div className="h-5 w-3/4 animate-pulse rounded-sm bg-paper-3" />
            <div className="h-5 w-2/3 animate-pulse rounded-sm bg-paper-3" />
            <div className="h-24 animate-pulse rounded-sm bg-paper-3" />
          </div>
        )}
        {loading && (
          <p className="mt-3 text-sm text-muted-foreground">
            Reading the reports. This takes a few seconds.
          </p>
        )}
        {state.status === "idle" && (
          <p className="text-sm text-muted-foreground">
            Select Generate AI Analysis to analyze the sample reports.
          </p>
        )}
      </div>
      {state.status === "error" && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-help-fill bg-help-soft px-4 py-3 text-sm leading-6 text-help"
        >
          {state.message}
        </p>
      )}
      {state.status === "done" && <AnalysisResultView result={state.result} />}
    </section>
  );
}

// A briefing: the summary and the ranked priorities lead, the observations and doubts sit
// beside them, and the original reports close as a table the commander can check.
function AnalysisResultView({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-10">
      <p className="text-sm leading-6 text-muted-foreground">
        {result.reportsAnalyzed} {result.reportsAnalyzed === 1 ? "report" : "reports"} analyzed
        {result.demo ? " (sample data)" : ""}, generated {formatDate(result.generatedAt)},{" "}
        {formatTime(result.generatedAt)} MYT.{result.cached ? " Reused a recent analysis." : ""}
      </p>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="min-w-0 space-y-10">
          <div>
            <h3 className="text-lg">Situation summary</h3>
            <p className="mt-3 max-w-[65ch] text-lg leading-8 text-ink">{result.summary}</p>
          </div>
          {result.priorities.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-lg">
                <ShieldAlert aria-hidden="true" className="size-5" />
                Suggested attention order
              </h3>
              <ol className="ruled mt-3 divide-y divide-rule">
                {result.priorities.map((item, index) => {
                  const style = priorityStyle[item.priority];
                  return (
                    <li
                      key={index}
                      className="grid gap-x-5 gap-y-2 py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
                    >
                      <span className="figure-mono pt-0.5 text-lg text-ink-3">{index + 1}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-pill px-2 py-0.5 text-sm font-medium ${style.className}`}
                          >
                            {style.label} priority
                          </span>
                          {item.uncertain && (
                            <span className="flex items-center gap-1 rounded-pill border border-dashed border-caution px-2 py-0.5 text-sm font-medium text-caution">
                              <AlertTriangle aria-hidden="true" className="size-3.5" />
                              Uncertain
                            </span>
                          )}
                        </div>
                        <h4 className="mt-2 font-display text-base font-semibold">{item.title}</h4>
                        <p className="mt-1 text-base leading-7 text-ink-2">{item.reason}</p>
                        <p className="mt-2 text-base leading-7">
                          <span className="font-semibold">
                            Suggested next step for you to consider:{" "}
                          </span>
                          {item.suggestedAction}
                        </p>
                        <ReportRefs ids={item.reportIds} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-10">
          {result.keyObservations.length > 0 && (
            <div>
              <h3 className="text-lg">Key observations</h3>
              <ul className="ruled mt-3 divide-y divide-rule text-base leading-7">
                {result.keyObservations.map((item, index) => (
                  <li key={index} className="py-3">
                    {item.text}
                    <ReportRefs ids={item.reportIds} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.uncertainties.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-lg">
                <OctagonAlert aria-hidden="true" className="size-5 text-caution" />
                Uncertainties and conflicts
              </h3>
              <ul className="mt-3 divide-y divide-rule border-t-2 border-dashed border-caution-fill text-base leading-7">
                {result.uncertainties.map((item, index) => (
                  <li key={index} className="py-3">
                    {item.text}
                    <ReportRefs ids={item.reportIds} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-lg">Original reports analyzed</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-ink-2">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Report
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Time
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Status
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Team
                </th>
                <th scope="col" className="py-2 font-medium">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {result.reports.map((report) => (
                <tr
                  key={report.id}
                  id={`ai-report-${report.id}`}
                  className="scroll-mt-24 align-top target:bg-signal-soft"
                >
                  <td className="figure-mono py-3 pr-4 text-ink-3">{report.id}</td>
                  <td className="py-3 pr-4">
                    <time className="figure-mono" dateTime={report.recordedAt}>
                      {formatTime(report.recordedAt)}
                    </time>
                  </td>
                  <td className="py-3 pr-4 font-medium whitespace-nowrap">
                    {statusLabel[report.status]}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">{report.team}</td>
                  <td className="py-3 leading-6">{report.message || "No message."}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        Generated by {result.model}. AI can make mistakes and the reports are unverified. Check the
        original reports before acting. Times are MYT.
      </p>
    </div>
  );
}
