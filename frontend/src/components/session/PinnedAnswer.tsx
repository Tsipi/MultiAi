import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, BookOpen, Briefcase, Code2, Layers, Megaphone, Network, Plane, Rocket, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownView } from "../primitives/MarkdownView";
import { FinalAnswerHeaderRoster, type RosterFace } from "./FinalAnswerAvatarStrip";
import { TEAM_TEMPLATES } from "@/data/templates";
import { Button } from "@/components/ui/button";

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
  finalAnswer: string;
  score: number;
  cast?: { writer: RosterFace; critics: RosterFace[] };
  teamTemplateName?: string;
  label?: string;
  subtitle?: string;
  previewWhenClosed?: boolean;
};

export function PinnedAnswer({
  finalAnswer,
  score,
  cast,
  teamTemplateName,
  label = "Final Answer",
  subtitle,
  previewWhenClosed = true,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const rosterRef = useRef<HTMLDivElement>(null);
  const faces = cast ? [cast.writer, ...cast.critics] : [];

  const template = teamTemplateName ? TEAM_TEMPLATES.find((t) => t.name === teamTemplateName) : null;
  const TemplateIcon: LucideIcon = template ? (TEMPLATE_ICONS[template.id] ?? Users) : Users;

  return (
    <div
      className={cn(
        "min-w-0 overflow-visible rounded-xl border border-border/60 shadow-sm",
        "animate-in slide-in-from-top-2 fade-in duration-400"
      )}
    >
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/[0.04] via-card/95 to-muted/15">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setExpanded((v) => !v)}
          className="relative flex h-auto w-full justify-start whitespace-normal rounded-none border-b border-border/45 px-4 py-3 pr-12 text-left font-normal hover:bg-muted/25 focus-visible:ring-offset-0"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                {label}
              </span>
              <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Score {score.toFixed(1)} / 10
              </span>
            </div>
            {subtitle && (
              <span className="truncate text-[0.7rem] font-normal normal-case tracking-normal text-muted-foreground">
                {subtitle}
              </span>
            )}
          </div>

          {faces.length > 0 && (
            <div
              ref={rosterRef}
              className="absolute right-11 top-1/2 z-10 -translate-y-1/2 hidden sm:block"
              onMouseEnter={() => {
                if (rosterRef.current && template) {
                  const r = rosterRef.current.getBoundingClientRect();
                  setTooltipPos({ x: r.left + r.width / 2, y: r.top });
                }
              }}
              onMouseLeave={() => setTooltipPos(null)}
            >
              <FinalAnswerHeaderRoster faces={faces} className="pointer-events-auto" />
            </div>
          )}

          <ChevronDown
            className={cn(
              "absolute right-4 top-1/2 z-20 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </Button>

      {!expanded && previewWhenClosed && (
        <div className="border-t border-border/40 bg-card/50 px-4 pb-3 pt-3 dark:bg-card/30">
          <MarkdownView
            content={finalAnswer}
            className="border-0 bg-transparent px-0 py-2 max-w-none shadow-none prose prose-sm prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm prose-strong:font-bold prose-strong:text-foreground prose-li:marker:text-muted-foreground text-foreground/80 line-clamp-5 overflow-hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(true)}
            className="mt-3 h-auto px-0 py-0 text-xs font-medium text-violet-600 hover:bg-transparent hover:underline hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            Show full answer
          </Button>
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

      {tooltipPos && template &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translate(-50%, calc(-100% - 10px))",
            }}
            className={cn(
              "pointer-events-none z-[9999] rounded-xl px-3 py-2 shadow-xl",
              "border border-gray-200 bg-white",
              "dark:border-white/10 dark:bg-gray-900 dark:shadow-2xl"
            )}
          >
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <TemplateIcon className="h-3 w-3 shrink-0 text-violet-500 dark:text-violet-400" strokeWidth={2} />
              <span className="text-[0.7rem] font-semibold text-gray-800 dark:text-white">
                {template.name}
              </span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
