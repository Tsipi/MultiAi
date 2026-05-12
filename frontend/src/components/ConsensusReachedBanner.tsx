type Props = { round: number; score: number | null };

export function ConsensusReachedBanner({ round, score }: Props) {
  return (
    <div className="mx-1 my-2 flex items-start gap-2 rounded-r-lg border-l-4 border-emerald-500 bg-emerald-500/10 px-3 py-2.5 animate-in slide-in-from-top-2 fade-in duration-400">
      <div>
        <p className="m-0 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Agreement reached at Round {round}
          {score !== null ? ` — Score ${score.toFixed(1)} / 10` : ""}
        </p>
        <p className="m-0 mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-400/80">
          The team reached consensus ahead of schedule.
        </p>
      </div>
    </div>
  );
}
