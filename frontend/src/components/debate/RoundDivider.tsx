type Props = { round: number; maxRounds?: number };

export function RoundDivider({ round, maxRounds }: Props) {
  return (
    <div className="flex items-center gap-3 py-2 select-none" role="separator">
      <div className="flex-1 border-t border-border/25" />
      <div className="inline-flex items-baseline gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200/50 dark:border-violet-700/40">
        <span className="text-[0.68rem] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Round {round}
        </span>
        {maxRounds && maxRounds > 0 && (
          <span className="text-[0.62rem] text-muted-foreground/55">of {maxRounds}</span>
        )}
      </div>
      <div className="flex-1 border-t border-border/25" />
    </div>
  );
}
