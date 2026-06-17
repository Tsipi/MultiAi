import type { ConsultResult, PhaseTiming } from "@/types";
import { fmtSeconds, fmtTokens } from "@/lib/sessionInsightsFormatters";
import { ModelUsageTable } from "../primitives/ModelUsageTable";

type ModelRow = {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_cost_usd: number;
};

type Props = Pick<
  ConsultResult,
  | "total_cost_usd"
  | "total_tokens"
  | "final_score"
  | "answer_mode"
  | "model_costs"
  | "total_duration_seconds"
  | "phase_timings"
  | "session_id"
>;

/** Summary metrics + per-model table for the session insights drawer. */
export function SessionInsightsTableView({
  total_cost_usd,
  total_tokens,
  final_score,
  answer_mode,
  model_costs,
  total_duration_seconds,
  phase_timings,
  session_id,
}: Props) {
  const rows = model_costs as ModelRow[];

  return (
    <div className="grid gap-6">
      <table className="w-full border-collapse overflow-hidden rounded-xl border border-violet-500/25 text-sm">
        <tbody>
          <tr className="border-b border-violet-500/15 bg-violet-500/[0.07]">
            <th scope="row" className="px-4 py-3 text-left font-display font-semibold text-foreground">
              Total cost
            </th>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
              ${total_cost_usd.toFixed(6)}
            </td>
          </tr>
          <tr className="border-b border-violet-500/15">
            <th scope="row" className="px-4 py-3 text-left font-medium text-muted-foreground">
              Total tokens
            </th>
            <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmtTokens(total_tokens)}</td>
          </tr>
          <tr className="bg-violet-500/[0.04]">
            <th scope="row" className="px-4 py-3 text-left font-medium text-muted-foreground">
              Agreement score
            </th>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
              {final_score.toFixed(1)} / 10
            </td>
          </tr>
          <tr className="border-t border-violet-500/15">
            <th scope="row" className="px-4 py-3 text-left font-medium text-muted-foreground">
              Answer mode
            </th>
            <td className="px-4 py-3 text-right font-semibold text-foreground">
              {answerModeLabel(answer_mode)}
            </td>
          </tr>
          <tr className="border-t border-violet-500/15 bg-violet-500/[0.04]">
            <th scope="row" className="px-4 py-3 text-left font-medium text-muted-foreground">
              Run duration
            </th>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
              {fmtSeconds(total_duration_seconds)}
            </td>
          </tr>
        </tbody>
      </table>

      <PhaseTimingTable rows={phase_timings} />

      <ModelUsageTable rows={rows} />

      {session_id ? (
        <p className="m-0 max-w-full break-all font-mono text-[0.72rem] text-muted-foreground/80 select-all">
          session: {session_id}
        </p>
      ) : null}
    </div>
  );
}

function PhaseTimingTable({ rows }: { rows: PhaseTiming[] }) {
  if (!rows.length) {
    return <p className="m-0 text-sm text-muted-foreground">No phase timing recorded for this run.</p>;
  }
  return (
    <div>
      <h4 className="font-display m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
        Phase timing
      </h4>
      <div className="overflow-hidden rounded-xl border border-violet-500/25">
        <table className="w-full border-collapse text-[0.82rem]">
          <thead>
            <tr className="border-b border-violet-500/25 bg-violet-500/10 text-left">
              <th className="px-3 py-2 font-display font-semibold text-foreground">Phase</th>
              <th className="px-3 py-2 text-right text-[0.72rem] font-medium text-muted-foreground">Time</th>
              <th className="px-3 py-2 text-right text-[0.72rem] font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.phase}-${index}`} className="border-b border-border/40 last:border-0 odd:bg-background/40">
                <td className="px-3 py-2 font-medium text-foreground">{phaseLabel(row.phase)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-foreground">{fmtSeconds(row.duration_seconds)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{statusLabel(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function phaseLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusLabel(row: PhaseTiming): string {
  if (row.status) return String(row.status).replace(/_/g, " ");
  if (typeof row.round_count === "number") return `${row.round_count} round${row.round_count === 1 ? "" : "s"}`;
  if (typeof row.source_count === "number") return `${row.source_count} source${row.source_count === 1 ? "" : "s"}`;
  return "";
}

function answerModeLabel(mode: ConsultResult["answer_mode"]): string {
  if (mode === "fast") return "Fast";
  if (mode === "deep") return "Deep";
  return "Balanced";
}
