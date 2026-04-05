type Props = {
  totalCostUsd: number;
  totalTokens: number;
  consensusScore: number;
};

export function SessionMetricsBar({ totalCostUsd, totalTokens, consensusScore }: Props) {
  const tiles = [
    { label: "Total Cost", value: `$${totalCostUsd.toFixed(6)}` },
    { label: "Total Tokens", value: totalTokens.toLocaleString() },
    { label: "Agreement Score", value: `${consensusScore.toFixed(1)}/10` },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5 mb-3">
      {tiles.map((tile) => (
        <div key={tile.label} className="border border-border rounded-lg p-3 bg-card/90 grid gap-1">
          <span className="text-[0.73rem] text-muted-foreground uppercase tracking-wide">{tile.label}</span>
          <strong className="text-[1.04rem] tabular-nums tracking-tight">{tile.value}</strong>
        </div>
      ))}
    </div>
  );
}
