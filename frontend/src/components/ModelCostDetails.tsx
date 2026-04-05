type Props = { rows: Array<Record<string, unknown>> };

export function ModelCostDetails({ rows }: Props) {
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
        Model Token &amp; Cost Breakdown
      </summary>
      <div className="mt-2 grid gap-2">
        {rows.map((row, idx) => (
          <article key={idx} className="border border-border rounded-md p-3 bg-card/90 text-sm grid gap-1">
            <strong className="text-foreground">{String(row.model)}</strong>
            <p className="text-muted-foreground m-0">
              <b>Tokens:</b> in {String(row.prompt_tokens)} / out {String(row.completion_tokens)} / total {String(row.total_tokens)}
            </p>
            <p className="text-muted-foreground m-0">
              <b>Cost USD:</b> in ${Number(row.prompt_cost_usd ?? 0).toFixed(6)} / out ${Number(row.completion_cost_usd ?? 0).toFixed(6)} / total ${Number(row.total_cost_usd ?? 0).toFixed(6)}
            </p>
          </article>
        ))}
      </div>
    </details>
  );
}
