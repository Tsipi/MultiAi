import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownView } from "./MarkdownView";
import { FinalAnswerHeaderRoster, type RosterFace } from "./FinalAnswerAvatarStrip";

type Props = {
  finalAnswer: string;
  score: number;
  cast?: { writer: RosterFace; criticA: RosterFace; criticB: RosterFace };
};

export function PinnedAnswer({
  finalAnswer,
  score,
  cast,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const faces = cast ? [cast.writer, cast.criticA, cast.criticB] : [];

  return (
    <div
      className={cn(
        "overflow-visible rounded-xl border border-border/60 shadow-sm",
        "animate-in slide-in-from-top-2 fade-in duration-400"
      )}
    >
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/[0.04] via-card/95 to-muted/15">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="relative flex w-full items-center gap-2 border-b border-border/45 px-4 py-3 pr-12 text-left transition-colors hover:bg-muted/25"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="font-display text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
              Final Answer
            </span>
            <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              Score {score.toFixed(1)} / 10
            </span>
          </div>

          {faces.length > 0 && (
            <div className="absolute right-11 top-1/2 z-10 -translate-y-1/2">
              <FinalAnswerHeaderRoster faces={faces} className="pointer-events-auto" />
            </div>
          )}

          <ChevronDown
            className={cn(
              "absolute right-4 top-1/2 z-20 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </button>

      {!expanded && (
        <div className="border-t border-border/40 bg-card/50 px-4 pb-3 pt-3 dark:bg-card/30">
          <MarkdownView
            content={finalAnswer}
            className="border-0 bg-transparent px-0 py-2 max-w-none shadow-none prose prose-sm prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-strong:font-bold prose-strong:text-foreground prose-li:marker:text-muted-foreground text-foreground/80 line-clamp-5 overflow-hidden"
          />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
          >
            Show full answer
          </button>
        </div>
      )}

      {expanded && (
        <div className="animate-in fade-in border-t border-border/40 bg-card/50 px-4 pb-4 duration-200 dark:bg-card/30">
          <MarkdownView
            content={finalAnswer}
            className="border-0 bg-transparent px-0 py-2 max-w-none shadow-none"
          />
        </div>
      )}
      </div>
    </div>
  );
}
