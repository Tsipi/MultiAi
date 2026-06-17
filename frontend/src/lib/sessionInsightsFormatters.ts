/** Short label for OpenRouter-style model ids. */
export function shortModel(id: string) {
  const parts = id.split("/");
  return parts.length > 1 ? parts[parts.length - 1] : id;
}

export function fmtTokens(n: unknown) {
  return Number(n ?? 0).toLocaleString();
}

/** Compact token display: 13108 -> 13.1k, 2350000 -> 2.4m */
export function fmtTokensCompact(n: unknown) {
  const v = Number(n ?? 0);
  if (Math.abs(v) < 1000) return String(Math.round(v));
  if (Math.abs(v) < 1_000_000) return `${(v / 1000).toFixed(1)}k`;
  return `${(v / 1_000_000).toFixed(1)}m`;
}

export function fmtUsd(n: unknown) {
  const v = Number(n ?? 0);
  if (v === 0) return "$0";
  if (v < 0.0001) return `$${v.toFixed(7)}`;
  if (v < 0.01) return `$${v.toFixed(6)}`;
  return `$${v.toFixed(4)}`;
}

export function fmtSeconds(n: unknown) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v) || v <= 0) return "0s";
  if (v < 10) return `${v.toFixed(1)}s`;
  return `${Math.round(v)}s`;
}
