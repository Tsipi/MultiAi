type Props = { rows: Array<Record<string, unknown>> };

export function ModelCostDetails({ rows }: Props) {
  return (
    <details>
      <summary>Model Token & Cost Breakdown</summary>
      {rows.map((row, idx) => (
        <article key={idx} className="round">
          <strong>{String(row.model)}</strong>
          <p><b>Tokens:</b> in {String(row.prompt_tokens)} / out {String(row.completion_tokens)} / total {String(row.total_tokens)}</p>
          <p><b>Cost USD:</b> in ${Number(row.prompt_cost_usd ?? 0).toFixed(6)} / out ${Number(row.completion_cost_usd ?? 0).toFixed(6)} / total ${Number(row.total_cost_usd ?? 0).toFixed(6)}</p>
        </article>
      ))}
    </details>
  );
}
