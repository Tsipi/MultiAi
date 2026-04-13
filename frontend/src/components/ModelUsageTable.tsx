import { fmtTokensCompact, fmtUsd, shortModel } from "@/lib/sessionInsightsFormatters";

type ModelRow = {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  total_cost_usd: number;
};

type Props = { rows: ModelRow[] };

/** Per-model token and cost table. */
export function ModelUsageTable({ rows }: Props) {
  if (!rows.length) {
    return <p className="m-0 text-sm text-muted-foreground">No per-model usage recorded for this run.</p>;
  }
  const totals = rows.reduce(
    (acc, row) => ({
      prompt_tokens: acc.prompt_tokens + Number(row.prompt_tokens ?? 0),
      completion_tokens: acc.completion_tokens + Number(row.completion_tokens ?? 0),
      total_tokens: acc.total_tokens + Number(row.total_tokens ?? 0),
      total_cost_usd: acc.total_cost_usd + Number(row.total_cost_usd ?? 0),
    }),
    { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, total_cost_usd: 0 }
  );

  return (
    <div>
      <h4 className="font-display m-0 mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
        Per-model usage
      </h4>
      <div className="overflow-hidden rounded-xl border border-violet-500/25">
        <table className="w-full table-fixed border-collapse text-[0.82rem]">
          <thead>
            <tr className="border-b border-violet-500/25 bg-violet-500/10 text-left">
              <th className="w-[37%] px-2 py-2 font-display font-semibold text-foreground">Model</th>
              <th className="w-[15%] px-2 py-2 text-right text-[0.72rem] font-medium text-muted-foreground">Input</th>
              <th className="w-[15%] px-2 py-2 text-right text-[0.72rem] font-medium text-muted-foreground">Output</th>
              <th className="w-[15%] px-2 py-2 text-right text-[0.72rem] font-medium text-muted-foreground">Total</th>
              <th className="w-[17%] px-2 py-2 text-right text-[0.72rem] font-medium text-muted-foreground">Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={`${row.model}-${idx}`}
                className="border-b border-border/40 last:border-0 odd:bg-background/40"
              >
                <td className="min-w-0 px-2 py-2 align-top">
                  <span className="text-[0.8rem] font-medium text-foreground" title={row.model}>
                    {shortModel(row.model)}
                  </span>
                  <span className="mt-0.5 block truncate text-[0.66rem] text-muted-foreground/95" title={row.model}>
                    {row.model}
                  </span>
                </td>
                <td className="px-1.5 py-2 text-right tabular-nums text-foreground/90 whitespace-nowrap">
                  {fmtTokensCompact(row.prompt_tokens)}
                </td>
                <td className="px-1.5 py-2 text-right tabular-nums text-foreground/90 whitespace-nowrap">
                  {fmtTokensCompact(row.completion_tokens)}
                </td>
                <td className="px-1.5 py-2 text-right tabular-nums text-foreground whitespace-nowrap">
                  {fmtTokensCompact(row.total_tokens)}
                </td>
                <td className="px-1.5 py-2 text-right tabular-nums text-foreground whitespace-nowrap">
                  {fmtUsd(row.total_cost_usd)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-violet-500/25 bg-violet-500/[0.06]">
              <td className="px-2 py-2 text-[0.76rem] font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-300">
                Total
              </td>
              <td className="px-1.5 py-2 text-right font-medium tabular-nums text-foreground/90 whitespace-nowrap">
                {fmtTokensCompact(totals.prompt_tokens)}
              </td>
              <td className="px-1.5 py-2 text-right font-medium tabular-nums text-foreground/90 whitespace-nowrap">
                {fmtTokensCompact(totals.completion_tokens)}
              </td>
              <td className="px-1.5 py-2 text-right font-semibold tabular-nums text-foreground whitespace-nowrap">
                {fmtTokensCompact(totals.total_tokens)}
              </td>
              <td className="px-1.5 py-2 text-right font-semibold tabular-nums text-foreground whitespace-nowrap">
                {fmtUsd(totals.total_cost_usd)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
