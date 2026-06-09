import { cn } from "@/lib/utils";
import type { AgentId } from "@/lib/parseActivityMessages";
import { ModelProviderIcon } from "./ModelProviderIcon";

// ─── Name color per seat ──────────────────────────────────────────────────────

const NAME_COLOR: Record<AgentId, string> = {
  writer:  "text-violet-600 dark:text-violet-400",
  critic1: "text-blue-600 dark:text-blue-400",
  critic2: "text-orange-600 dark:text-orange-400",
  critic3: "text-teal-600 dark:text-teal-400",
  critic4: "text-rose-600 dark:text-rose-400",
  critic5: "text-amber-600 dark:text-amber-400",
  critic6: "text-lime-600 dark:text-lime-400",
  scorer:  "text-emerald-600 dark:text-emerald-400",
  system:  "text-muted-foreground",
};

// ─── ChatMessage ──────────────────────────────────────────────────────────────

type Props = {
  speaker: AgentId;
  name: string;
  /** e.g. "Writer · Investment Analyst" */
  sublabel?: string;
  avatar: string;
  text: string;
  modelId?: string;
  isNew?: boolean;
  align?: "left" | "right";
};

export function ChatMessage({
  speaker, name, sublabel, avatar, text, modelId,
  isNew, align = "left",
}: Props) {
  const right = align === "right";

  return (
    <div
      className={cn(
        "flex gap-3 px-1 py-1 rounded-lg hover:bg-muted/30 transition-colors",
        right && "flex-row-reverse",
        isNew && "animate-in fade-in slide-in-from-bottom-1 duration-250"
      )}
    >
      {/* Avatar + model badge */}
      <div className="relative h-9 w-9 shrink-0 mt-0.5">
        <img
          src={avatar}
          alt={name}
          className="h-full w-full rounded-full border border-border object-cover block"
        />
        {modelId && (
          <span className="absolute -bottom-0.5 -right-0.5 flex leading-none" aria-hidden>
            <ModelProviderIcon
              modelId={modelId}
              title={modelId}
              className="!h-[15px] !w-[15px] !min-h-0 !rounded-[4px] !text-[7px]"
            />
          </span>
        )}
      </div>

      {/* Content */}
      <div className={cn("min-w-0 flex-1", right && "items-end")}>
        {/* Name row */}
        <div className={cn("flex items-baseline gap-1.5 flex-wrap mb-0", right && "flex-row-reverse")}>
          <span className={cn("text-sm font-semibold leading-none", NAME_COLOR[speaker])}>
            {name}
          </span>
        </div>

        {/* Seat + role sublabel (like Directors Cut) */}
        {sublabel && (
          <p className="m-0 mb-1 text-[0.62rem] text-muted-foreground/55 leading-snug">
            {sublabel}
          </p>
        )}

        {/* Message body */}
        <p className={cn("m-0 text-sm leading-relaxed text-foreground/85", right && "text-right")}>
          {text}
        </p>
      </div>
    </div>
  );
}

// ─── SkeletonMessage ──────────────────────────────────────────────────────────

type SkeletonMessageProps = { lines?: [string, string?, string?]; delay?: string };

export function SkeletonMessage({ lines = ["w-4/5", "w-3/5"], delay = "0ms" }: SkeletonMessageProps) {
  return (
    <div className="flex gap-3 px-1 py-1" style={{ animationDelay: delay }}>
      <div className="h-9 w-9 shrink-0 rounded-full bg-muted/60 animate-pulse mt-0.5" />
      <div className="min-w-0 flex-1 grid gap-1.5 pt-0.5">
        <div className="flex items-baseline gap-2 mb-0.5">
          <div className="h-2.5 w-14 rounded bg-muted/70 animate-pulse" style={{ animationDelay: delay }} />
          <div className="h-2 w-9 rounded-full bg-muted/50 animate-pulse" style={{ animationDelay: delay }} />
        </div>
        {lines.filter(Boolean).map((w, i) => (
          <div
            key={i}
            className={cn("h-2.5 rounded bg-muted/50 animate-pulse", w)}
            style={{ animationDelay: `calc(${delay} + ${i * 80}ms)` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── SystemMessage ────────────────────────────────────────────────────────────

export function SystemMessage({ text, isNew }: { text: string; isNew?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center px-2 py-1",
        isNew && "animate-in fade-in duration-300"
      )}
    >
      <p className="m-0 text-[0.75rem] text-muted-foreground/70 italic text-center">{text}</p>
    </div>
  );
}
