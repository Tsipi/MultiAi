import type { ConsultResult } from "@/types";
import { fmtTokens } from "@/lib/sessionInsightsFormatters";
import { ModelUsageTable } from "./ModelUsageTable";

type ModelRow = {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_cost_usd: number;
};

type Props = Pick<
  ConsultResult,
  "total_cost_usd" | "total_tokens" | "final_score" | "model_costs" | "session_id"
>;

/** Summary metrics + per-model table for the session insights drawer. */
export function SessionInsightsTableView({
  total_cost_usd,
  total_tokens,
  final_score,
  model_costs,
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
        </tbody>
      </table>

      <ModelUsageTable rows={rows} />

      {session_id ? (
        <p className="m-0 max-w-full break-all font-mono text-[0.72rem] text-muted-foreground/80 select-all">
          session: {session_id}
        </p>
      ) : null}
    </div>
  );
}
