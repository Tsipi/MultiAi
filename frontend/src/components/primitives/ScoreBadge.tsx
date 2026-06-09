import { cn } from "@/lib/utils";
import { extractScoreFromMessage } from "@/lib/parseActivityMessages";

type Props = { text: string; previousScore: number | null };

export function ScoreBadge({ text, previousScore }: Props) {
  const parsed = extractScoreFromMessage(text);
  const summaryMatch =
    text.match(/relevance\s+[\d.]+\.?\s+(.*)/i) ??
    text.match(/consensus\s+[\d.]+\.?\s+(.*)/i);
  const summary = summaryMatch?.[1]?.trim() ?? "";
  const score = parsed?.consensus ?? null;
  const improved = score !== null && previousScore !== null && score > previousScore;
  const same = score !== null && previousScore !== null && score === previousScore;
  const dropped = score !== null && previousScore !== null && score < previousScore;

  return (
    <div
      className={cn(
        "mx-1 my-2 rounded-xl border px-3 py-2.5",
        "animate-in fade-in slide-in-from-bottom-1 duration-300",
        improved
          ? "border-emerald-300/50 bg-emerald-50/60 dark:border-emerald-700/40 dark:bg-emerald-950/30"
          : dropped
            ? "border-red-200/50 bg-red-50/40 dark:border-red-800/40 dark:bg-red-950/20"
            : "border-amber-200/50 bg-amber-50/40 dark:border-amber-700/30 dark:bg-amber-950/20"
      )}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground/80">
          Scorer
        </span>
        {score !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-bold tabular-nums",
              improved
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                : same
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
            )}
          >
            <span>{improved ? "▲" : same ? "=" : "▼"}</span>
            <span>{score.toFixed(1)} / 10</span>
          </span>
        )}
        {parsed?.relevance != null && (
          <span className="text-[0.65rem] text-muted-foreground/60">
            rel {parsed.relevance.toFixed(1)}
          </span>
        )}
      </div>
      {summary && (
        <p className="mt-1.5 m-0 text-[0.72rem] text-muted-foreground leading-snug line-clamp-2 italic">
          "{summary}"
        </p>
      )}
    </div>
  );
}
