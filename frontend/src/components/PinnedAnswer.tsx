import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownView } from "./MarkdownView";
import { Button } from "@/components/ui/button";

type Props = {
  finalAnswer: string;
  score: number;
  onDownloadMd: () => void;
  onDownloadPdf: () => void;
  exportBusy?: boolean;
};

export function PinnedAnswer({ finalAnswer, score, onDownloadMd, onDownloadPdf, exportBusy }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "border border-border/60 rounded-xl overflow-hidden shadow-sm",
        "bg-gradient-to-br from-violet-500/5 via-card/95 to-muted/20",
        "animate-in slide-in-from-top-2 fade-in duration-400"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm truncate">Final Answer</span>
          <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            Score {score.toFixed(1)} / 10
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {!expanded && (
        <div className="px-4 pb-3 border-t border-border/40">
          <p className="m-0 mt-2 text-sm leading-relaxed text-foreground/80 line-clamp-2">
            {finalAnswer}
          </p>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
          >
            Show full answer
          </button>
        </div>
      )}

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 animate-in fade-in duration-200">
          <MarkdownView
            content={finalAnswer}
            className="border-0 bg-transparent px-0 py-2 max-w-none shadow-none"
          />
          <div className="flex flex-wrap gap-2 pt-3 mt-2 border-t border-border/40">
            <Button variant="outline" size="sm" disabled={exportBusy} onClick={onDownloadMd}>
              {exportBusy ? "Preparing…" : "Download (Markdown)"}
            </Button>
            <Button variant="outline" size="sm" disabled={exportBusy} onClick={onDownloadPdf}>
              {exportBusy ? "Preparing…" : "Download (PDF)"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
