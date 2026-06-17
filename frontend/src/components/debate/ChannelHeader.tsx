import { useEffect, useRef, useState } from "react";
import {
  BookOpen, Briefcase, Code2, Layers, Megaphone,
  Network, Plane, Rocket, TrendingUp, Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/data/experts";
import { TEAM_TEMPLATES } from "@/data/templates";
import type { AnswerMode } from "@/types";
import { DEBATE_SYSTEM_AVATAR } from "./DebateActivityPrimitives";

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  "programmer":         Code2,
  "research-writing":   BookOpen,
  "tourist-planner":    Plane,
  "ux-product":         Layers,
  "startup-gtm":        Rocket,
  "marketing-campaign": Megaphone,
  "investment-debate":  TrendingUp,
  "resume-career":      Briefcase,
  "tech-architecture":  Network,
};

type Props = {
  currentRound: number;
  maxRounds: number;
  score: number | null;
  previousScore: number | null;
  loading: boolean;
  stageLabel: string;
  answerMode: AnswerMode;
  elapsedSeconds?: number;
  team: TeamMember[];
  teamTemplateName?: string;
};

function useAnimatedScore(target: number | null, duration = 800) {
  const [displayed, setDisplayed] = useState<number | null>(target);
  const rafRef = useRef<number | null>(null);
  const prevTarget = useRef<number | null>(target);

  useEffect(() => {
    if (target === null) { setDisplayed(null); return; }
    const from = prevTarget.current ?? 0;
    prevTarget.current = target;
    if (from === target) { setDisplayed(target); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(from + (target - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return displayed;
}

export function ChannelHeader({
  currentRound, maxRounds, score, previousScore, loading, stageLabel, answerMode, elapsedSeconds, team, teamTemplateName,
}: Props) {
  const animatedScore = useAnimatedScore(score);
  const improved = score !== null && previousScore !== null && score > previousScore;
  const dropped  = score !== null && previousScore !== null && score < previousScore;

  // Resolve icon and display name from template
  const template = teamTemplateName
    ? TEAM_TEMPLATES.find((t) => t.name === teamTemplateName)
    : null;
  const Icon: LucideIcon = template ? (TEMPLATE_ICONS[template.id] ?? Users) : Users;
  const displayName = teamTemplateName ?? "Team Debate";
  const modeLabel = answerMode.charAt(0).toUpperCase() + answerMode.slice(1);
  const elapsedLabel = elapsedSeconds != null
    ? elapsedSeconds < 60
      ? `${elapsedSeconds}s`
      : `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`
    : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10 rounded-t-xl">

      {/* Channel name */}
      <div className="flex min-w-[180px] flex-1 items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-violet-500 dark:text-violet-400" strokeWidth={2} />
        <span className="font-display text-sm font-bold text-violet-700 dark:text-violet-400 truncate tracking-tight">
          {displayName}
        </span>
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

      {loading && (
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-[0.68rem] font-semibold">
          <span className="truncate rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-700 dark:text-sky-300">
            {stageLabel}
          </span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300">
            {modeLabel}
          </span>
          {elapsedLabel && (
            <span className="tabular-nums text-muted-foreground">
              {elapsedLabel}
            </span>
          )}
        </div>
      )}

      {/* Round + score */}
      <div className="flex min-w-[120px] items-center justify-end gap-3 text-xs text-muted-foreground">
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
              improved ? "text-emerald-600 dark:text-emerald-400"
                : dropped  ? "text-red-500 dark:text-red-400"
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
            src={m.avatar || DEBATE_SYSTEM_AVATAR}
            alt={m.name}
            title={m.name}
            className="h-6 w-6 rounded-full border-2 border-card object-cover"
            onError={(event) => {
              event.currentTarget.src = DEBATE_SYSTEM_AVATAR;
            }}
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
