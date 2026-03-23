type Props = {
  totalCostUsd: number;
  totalTokens: number;
  consensusScore: number;
};

export function SessionMetricsBar({ totalCostUsd, totalTokens, consensusScore }: Props) {
  const tiles = [
    { label: "Total Cost", value: `$${totalCostUsd.toFixed(6)}` },
    { label: "Total Tokens", value: totalTokens.toLocaleString() },
    { label: "Agreement Score", value: `${consensusScore.toFixed(1)}/10` }
  ];
  return (
    <div className="metrics-bar">
      {tiles.map((tile) => (
        <div key={tile.label} className="metric-tile">
          <span>{tile.label}</span>
          <strong>{tile.value}</strong>
        </div>
      ))}
    </div>
  );
}
