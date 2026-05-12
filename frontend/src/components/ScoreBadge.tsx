import { cn } from "@/lib/utils";
import { extractScoreFromMessage } from "@/lib/parseActivityMessages";

type Props = { text: string; previousScore: number | null };

export function ScoreBadge({ text, previousScore }: Props) {
  const parsed = extractScoreFromMessage(text);
  const summaryMatch = text.match(/relevance [\d.]+[.\s]+(.*)/i);
  const summary = summaryMatch?.[1]?.trim() ?? "";
  const score = parsed?.consensus ?? null;
  const improved = score !== null && previousScore !== null && score > previousScore;
  const same = score !== null && previousScore !== null && score === previousScore;

  return (
    <div
      className={cn(
        "mx-1 my-1 rounded-lg border px-3 py-2.5",
        "bg-muted/40 border-border/50",
        "animate-in fade-in slide-in-from-bottom-1 duration-300"
      )}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[0.7rem] font-bold uppercase tracking-widest text-muted-foreground">
          Scorer
        </span>
        {score !== null && (
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              improved
                ? "text-emerald-600 dark:text-emerald-400"
                : same
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-500 dark:text-red-400"
            )}
          >
            {improved ? "+" : same ? "=" : "-"} {score.toFixed(1)} / 10
          </span>
        )}
        {parsed?.relevance != null && (
          <span className="text-[0.7rem] text-muted-foreground">
            · Relevance {parsed.relevance.toFixed(1)}
          </span>
        )}
      </div>
      {summary && (
        <p className="mt-1 m-0 text-xs text-muted-foreground leading-snug line-clamp-2">
          "{summary}"
        </p>
      )}
    </div>
  );
}
