import { BarChart3, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  hasResult: boolean;
  onNewQuestion: () => void;
  onOpenInsights: () => void;
  onOpenAdvanced: () => void;
};

export function SessionViewActions({ hasResult, onNewQuestion, onOpenInsights, onOpenAdvanced }: Props) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-violet-500/20 bg-[var(--app-surface)] px-1.5 py-1.5 shadow-sm">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 rounded-xl border border-violet-300/45 bg-violet-50 px-3 text-xs font-semibold text-violet-700 hover:border-violet-400/70 hover:bg-violet-100 hover:shadow-md hover:text-violet-800"
        onClick={onNewQuestion}
      >
        + New question
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!hasResult}
        className="h-9 w-9 rounded-xl border border-violet-300/45 bg-violet-50 text-violet-700 hover:border-violet-400/70 hover:bg-violet-100 hover:shadow-md hover:text-violet-800 disabled:opacity-40"
        onClick={onOpenInsights}
        aria-label="Open session insights"
      >
        <BarChart3 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-xl border border-violet-300/45 bg-violet-50 text-violet-700 hover:border-violet-400/70 hover:bg-violet-100 hover:shadow-md hover:text-violet-800"
        onClick={onOpenAdvanced}
        aria-label="Open advanced setup"
      >
        <Settings2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
