type Props = { round: number };

export function RoundDivider({ round }: Props) {
  return (
    <div className="flex items-center gap-3 py-2 select-none" role="separator">
      <div className="flex-1 border-t border-border/40" />
      <span className="text-[0.68rem] font-semibold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">
        Round {round}
      </span>
      <div className="flex-1 border-t border-border/40" />
    </div>
  );
}
