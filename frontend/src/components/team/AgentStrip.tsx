import { useState } from "react";
import { UserPlus } from "lucide-react";
import { TeamMember } from "@/data/experts";
import { cn } from "@/lib/utils";
import { detectActiveAgent, type AgentSlot } from "@/lib/detectActiveAgent";
import { appendDefaultTeamMember } from "@/lib/teamRoster";
import { V2SectionHeader } from "../primitives/V2SectionHeader";
import { BenchCard, StripCard } from "./AgentStripCards";
import { TeamMemberEditModal } from "./TeamMemberEditModal";

type Props = {
  team: TeamMember[];
  onTeamChange: (next: TeamMember[]) => void;
  leadRole: string;
  loading: boolean;
  lastActivityLine: string | undefined;
};

export function AgentStrip({ team, onTeamChange, leadRole, loading, lastActivityLine }: Props) {
  const active: AgentSlot = loading ? detectActiveAgent(lastActivityLine) : "bench";
  const roster = team;
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const saveMember = (next: TeamMember) => {
    onTeamChange(team.map((x) => (x.id === next.id ? next : x)));
  };

  return (
    <section className="w-full">
      <TeamMemberEditModal
        open={Boolean(editing)}
        member={editing}
        leadRole={leadRole}
        onClose={() => setEditing(null)}
        onSave={saveMember}
      />
      <V2SectionHeader
        eyebrow="Your AI team"
        subtitle="Fixed roster for each run: the Writer drafts answers, two Critics push back, and the Bench (scorer + summarizer, always DeepSeek on the server) turns rounds into scores and short summaries."
        tip="Double-click any roster card to edit name, seat, model, and strengths. More options live under Advanced setup."
      />
      <div className="v2-strip-grid v2-strip-stagger">
        {roster.map((m) => (
          <StripCard
            key={m.id}
            member={m}
            roster={roster}
            active={active}
            loading={loading}
            canRemove={team.length > 1}
            leadRole={leadRole}
            onRemove={() => onTeamChange(team.filter((x) => x.id !== m.id))}
            onEdit={setEditing}
          />
        ))}
        <BenchCard hot={active === "bench" && loading} loading={loading} />
        <button
          type="button"
          disabled={loading}
          onClick={() => onTeamChange(appendDefaultTeamMember(team, leadRole))}
          className={cn(
            "flex min-h-[104px] w-full min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-500/35",
            "bg-[var(--v2-surface)] px-3 py-4 text-violet-600 transition-colors hover:border-violet-500/55 hover:bg-violet-500/5",
            "dark:text-violet-300 disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          <UserPlus className="h-6 w-6" strokeWidth={2} />
          <span className="font-display text-xs font-semibold">Add an Agent</span>
        </button>
      </div>
    </section>
  );
}
