import { X } from "lucide-react";
import { TeamMember } from "@/data/experts";
import { cn } from "@/lib/utils";
import type { AgentSlot } from "@/lib/detectActiveAgent";
import { ModelProviderIcon } from "../primitives/ModelProviderIcon";
import { Button } from "@/components/ui/button";

export const BENCH_META = {
  name: "Consensus bench",
  tag: "DeepSeek scorer + summary",
  avatarHue: "from-violet-500 to-indigo-600",
  benchModelLabel: "deepseek/deepseek-chat-v3.2",
} as const;

export function memberHot(member: TeamMember, roster: TeamMember[], slot: AgentSlot): boolean {
  if (slot === "writer") return member.duty === "writer";
  const m = slot.match(/^critic(\d+)$/);
  if (m) {
    const idx = parseInt(m[1], 10) - 1;
    const critics = roster.filter((x) => x.duty === "critic");
    return critics[idx]?.id === member.id;
  }
  return false;
}

export function StripCard({
  member,
  roster,
  active,
  loading,
  canRemove,
  leadRole,
  onRemove,
  onEdit,
}: {
  member: TeamMember;
  roster: TeamMember[];
  active: AgentSlot;
  loading: boolean;
  canRemove: boolean;
  leadRole: string;
  onRemove: () => void;
  onEdit?: (member: TeamMember) => void;
}) {
  const shortModel = member.model.includes("/") ? member.model.split("/").slice(-1)[0] : member.model;
  const hot = loading && memberHot(member, roster, active);
  const trimmedRole = member.role.trim();
  const trimmedLead = leadRole.trim();
  const showRoleOverride = Boolean(trimmedRole) && trimmedRole !== trimmedLead;
  return (
    <div
      role="button"
      tabIndex={0}
      title="Double-click to edit name, seat, model, and focus"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!loading) onEdit?.(member);
        }
      }}
      onDoubleClick={() => {
        if (!loading) onEdit?.(member);
      }}
      className={cn(
        "relative flex min-h-[104px] w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-[#ffffff10] bg-[var(--app-surface)] py-2.5 pl-3 pr-8",
        "outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
        hot && "agent-pulse border-violet-500/45"
      )}
    >
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
          aria-label={`Remove ${member.name} from team`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
      <img src={member.avatar} alt="" className="h-11 w-11 rounded-full object-cover border border-[#ffffff12]" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold leading-tight truncate m-0">{member.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 min-w-0">
          <ModelProviderIcon modelId={member.model} title={member.model} />
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground truncate m-0">
            {member.duty === "writer" ? "Writer" : "Critic"} · {shortModel}
          </p>
        </div>
        {showRoleOverride && (
          <p className="text-[10px] text-violet-700 dark:text-violet-300 truncate m-0 mt-0.5">
            Focus override: {trimmedRole}
          </p>
        )}
      </div>
    </div>
  );
}

export function BenchCard({ hot, loading }: { hot: boolean; loading: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-[104px] w-full min-w-0 items-center gap-3 rounded-xl border border-[#ffffff10] bg-[var(--app-surface)] px-3 py-2.5",
        hot && loading && "agent-pulse border-violet-500/45"
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
          BENCH_META.avatarHue
        )}
      >
        Σ
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold leading-tight truncate m-0">{BENCH_META.name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 min-w-0">
          <ModelProviderIcon modelId={BENCH_META.benchModelLabel} title="Scorer & summarizer (DeepSeek)" />
          <p className="text-[10px] font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300/90 truncate m-0">
            {BENCH_META.tag}
          </p>
        </div>
      </div>
    </div>
  );
}
