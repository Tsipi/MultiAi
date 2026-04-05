type ModelRow = {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_cost_usd: number;
  completion_cost_usd: number;
  total_cost_usd: number;
};

type Props = {
  rows: Array<Record<string, unknown>>;
  sessionId?: string;
};

function fmt(n: unknown) {
  return Number(n ?? 0).toLocaleString();
}

function usd(n: unknown) {
  const v = Number(n ?? 0);
  if (v === 0) return "$0";
  if (v < 0.0001) return `$${v.toFixed(7)}`;
  if (v < 0.01) return `$${v.toFixed(6)}`;
  return `$${v.toFixed(4)}`;
}

function shortModel(id: string) {
  const parts = id.split("/");
  return parts.length > 1 ? parts[parts.length - 1] : id;
}

/** Per-model token and cost grid inside bordered cards. */
export function ModelCostBreakdown({ rows, sessionId }: Props) {
  const typed = rows as ModelRow[];
  if (!typed.length) {
    return <p className="text-xs text-muted-foreground m-0">No per-model usage recorded.</p>;
  }
  return (
    <div className="grid gap-2.5">
      {typed.map((row, idx) => (
        <div key={idx} className="border border-border/75 rounded-lg bg-card/85 overflow-hidden">
          <div className="px-3 py-2 border-b border-border/55 bg-muted/30">
            <span className="text-xs font-semibold text-foreground/85 tracking-wide" title={row.model}>
              {shortModel(row.model)}
            </span>
            <span className="text-[0.7rem] text-muted-foreground ml-2">{row.model}</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border/55">
            {[
              { label: "Input", tokens: row.prompt_tokens, cost: row.prompt_cost_usd },
              { label: "Output", tokens: row.completion_tokens, cost: row.completion_cost_usd },
              { label: "Total", tokens: row.total_tokens, cost: row.total_cost_usd, bold: true },
            ].map(({ label, tokens, cost, bold }) => (
              <div key={label} className="px-3 py-2 grid gap-0.5">
                <span className="text-[0.68rem] text-muted-foreground uppercase tracking-wider">{label}</span>
                <span className={`text-sm tabular-nums ${bold ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                  {fmt(tokens)}
                </span>
                <span className={`text-[0.75rem] tabular-nums ${bold ? "font-medium text-foreground/90" : "text-muted-foreground"}`}>
                  {usd(cost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {sessionId && (
        <div className="flex justify-end pt-0.5">
          <span className="text-[0.72rem] text-muted-foreground/75 font-mono select-all">session: {sessionId}</span>
        </div>
      )}
    </div>
  );
}
