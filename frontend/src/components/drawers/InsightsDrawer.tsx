import { BarChart3, X } from "lucide-react";
import { useEffect } from "react";
import type { ConsultResult } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SessionInsightsTableView } from "../session/SessionInsightsTableView";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ConsultResult | null;
};

/** Right-hand drawer for token/cost insights (replaces inline Session Insights). */
export function InsightsDrawer({ open, onOpenChange, result }: Props) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[91]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close session insights"
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-[520px] overflow-y-auto border-l border-[#ffffff10]",
          "bg-[var(--app-surface)] shadow-[0_0_40px_rgba(0,0,0,0.35)]"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#ffffff10] bg-[var(--app-elevated)] px-4 py-3">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
              <BarChart3 className="h-4 w-4 shrink-0 text-violet-400" aria-hidden />
              Session insights
            </p>
            <p className="m-0 text-xs text-muted-foreground">Costs, tokens, and per-model usage</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          {result ? (
            <SessionInsightsTableView
              total_cost_usd={result.total_cost_usd}
              total_tokens={result.total_tokens}
              final_score={result.final_score}
              answer_mode={result.answer_mode}
              model_costs={result.model_costs}
              total_duration_seconds={result.total_duration_seconds}
              phase_timings={result.phase_timings}
              session_id={result.session_id}
            />
          ) : (
            <p className="m-0 text-sm text-muted-foreground">
              Run a consult or select a session with a completed answer to see insights.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
