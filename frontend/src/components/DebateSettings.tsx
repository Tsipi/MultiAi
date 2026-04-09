import { ConsultPayload } from "../types";
import { TeamMember } from "../data/experts";
import { appendDefaultTeamMember } from "@/lib/teamRoster";
import { TeamMemberCard } from "./TeamMemberCard";
import { Button } from "@/components/ui/button";
import { DebateOptionsTable } from "./DebateOptionsTable";
import { SlidersHorizontal, UserPlus } from "lucide-react";

type Props = {
  value: ConsultPayload;
  team: TeamMember[];
  onChange: (next: ConsultPayload) => void;
  onTeamChange: (next: TeamMember[]) => void;
};

export function DebateSettings({ value, team, onChange, onTeamChange }: Props) {
  const set = <K extends keyof ConsultPayload>(key: K, val: ConsultPayload[K]) =>
    onChange({ ...value, [key]: val });

  const updateMember = (idx: number, next: TeamMember) =>
    onTeamChange(team.map((m, i) => (i === idx ? next : m)));

  const addMember = () => onTeamChange(appendDefaultTeamMember(team, value.role));

  return (
    <>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 192px), 1fr))" }}
      >
        {team.map((member, idx) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            baseRole={value.role}
            canRemove={team.length > 1}
            onUpdate={(next) => updateMember(idx, next)}
            onRemove={() => onTeamChange(team.filter((_, i) => i !== idx))}
          />
        ))}
      </div>
      <section className="grid gap-2.5 rounded-xl border border-ring/35 bg-gradient-to-br from-ring/10 to-card/40 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-ring" />
          Team tools
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          Tune debate strictness and expand your team quickly.
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <DebateOptionsTable
            maxRounds={value.max_rounds}
            consensusScore={value.consensus_score}
            onMaxRounds={(n) => set("max_rounds", n)}
            onConsensusScore={(n) => set("consensus_score", n)}
          />
          <Button size="sm" className="v2-primary-cta h-9 shrink-0 border-0 shadow-none font-display" onClick={addMember}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Add another team member
          </Button>
        </div>
      </section>
      <p className="m-0 text-[0.85rem] text-muted-foreground">Scorer and summarizer always use Deepseek v3.2.</p>
    </>
  );
}
