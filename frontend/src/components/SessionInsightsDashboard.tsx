import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelCostBreakdown } from "./ModelCostBreakdown";

type Props = {
  totalCostUsd: number;
  totalTokens: number;
  consensusScore: number;
  modelCosts: Array<Record<string, unknown>>;
  sessionId?: string;
  className?: string;
};

/**
 * Collapsible run metrics (default closed). Bordered dashboard blocks inside.
 */
export function SessionInsightsDashboard({
  totalCostUsd,
  totalTokens,
  consensusScore,
  modelCosts,
  sessionId,
  className,
}: Props) {
  const tiles = [
    { label: "Total cost", value: `$${totalCostUsd.toFixed(6)}` },
    { label: "Total tokens", value: totalTokens.toLocaleString() },
    { label: "Agreement", value: `${consensusScore.toFixed(1)}/10` },
  ];
  return (
    <details
      className={cn(
        "group rounded-xl border border-border/70 overflow-hidden mb-3",
        "bg-gradient-to-br from-muted/45 via-card/95 to-muted/25",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
        "dark:from-muted/15 dark:via-card/90 dark:to-muted/10",
        className
      )}
    >
      <summary
        className={cn(
          "cursor-pointer list-none flex items-center justify-between gap-2 px-3.5 py-2.5",
          "hover:bg-muted/35 transition-colors",
          "[&::-webkit-details-marker]:hidden"
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-foreground/75">
          Session insights
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="px-3.5 pb-3.5 pt-0 space-y-3 border-t border-border/55">
        <div className="grid grid-cols-3 gap-2.5 pt-2.5">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="rounded-lg border border-border/60 bg-background/60 dark:bg-background/40 px-2.5 py-2 grid gap-1 min-w-0"
            >
              <span className="text-[0.68rem] text-muted-foreground uppercase tracking-wide truncate">
                {tile.label}
              </span>
              <strong className="text-[0.98rem] tabular-nums tracking-tight leading-tight truncate">
                {tile.value}
              </strong>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border/50 bg-muted/25 dark:bg-muted/15 px-2.5 py-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-foreground/70 m-0 mb-2">
            Model token and cost breakdown
          </p>
          <ModelCostBreakdown rows={modelCosts} sessionId={sessionId} />
        </div>
      </div>
    </details>
  );
}
