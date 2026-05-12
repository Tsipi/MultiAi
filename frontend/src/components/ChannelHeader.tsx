import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/data/experts";

type Props = {
  currentRound: number;
  maxRounds: number;
  score: number | null;
  previousScore: number | null;
  loading: boolean;
  team: TeamMember[];
};

function useAnimatedScore(target: number | null, duration = 800) {
  const [displayed, setDisplayed] = useState<number | null>(target);
  const rafRef = useRef<number | null>(null);
  const prevTarget = useRef<number | null>(target);

  useEffect(() => {
    if (target === null) {
      setDisplayed(null);
      return;
    }
    const from = prevTarget.current ?? 0;
    prevTarget.current = target;
    if (from === target) {
      setDisplayed(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplayed(from + (target - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return displayed;
}

export function ChannelHeader({
  currentRound,
  maxRounds,
  score,
  previousScore,
  loading,
  team,
}: Props) {
  const animatedScore = useAnimatedScore(score);
  const improved = score !== null && previousScore !== null && score > previousScore;
  const dropped = score !== null && previousScore !== null && score < previousScore;

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10 rounded-t-xl">
      {/* Channel name + live badge */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-bold text-foreground/50 font-mono">#</span>
        <span className="text-sm font-semibold truncate">debate-channel</span>
        {loading && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        )}
      </div>

      {/* Round + score */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {currentRound > 0 && (
          <span className="tabular-nums">
            Round{" "}
            <span className="font-semibold text-foreground/80">{currentRound}</span>
            {maxRounds > 0 && <span> / {maxRounds}</span>}
          </span>
        )}
        {animatedScore !== null && (
          <span
            className={cn(
              "font-bold tabular-nums transition-colors",
              improved
                ? "text-emerald-600 dark:text-emerald-400"
                : dropped
                  ? "text-red-500 dark:text-red-400"
                  : "text-foreground/80"
            )}
          >
            {animatedScore.toFixed(1)}
            <span className="font-normal text-muted-foreground"> / 10</span>
          </span>
        )}
      </div>

      {/* Team avatar strip */}
      <div className="flex items-center -space-x-2">
        {team.slice(0, 6).map((m) => (
          <img
            key={m.id}
            src={m.avatar}
            alt={m.name}
            title={m.name}
            className="h-6 w-6 rounded-full border-2 border-card object-cover"
          />
        ))}
        {team.length > 6 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[0.6rem] font-bold text-muted-foreground">
            +{team.length - 6}
          </span>
        )}
      </div>
    </div>
  );
}
