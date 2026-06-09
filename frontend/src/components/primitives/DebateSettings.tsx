import { ConsultPayload } from "../../types";
import { TeamMember } from "../../data/experts";
import { appendDefaultTeamMember } from "@/lib/teamRoster";
import { TeamMemberCard } from "../team/TeamMemberCard";
import { Button } from "@/components/ui/button";
import { DebateOptionsTable } from "./DebateOptionsTable";
import { SlidersHorizontal, UserPlus } from "lucide-react";
import { InfoTip } from "./InfoTip";

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
      <p className="m-0 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/80">
        Team Members
        <InfoTip tipAlign="end">Manage the roster for this session only.</InfoTip>
      </p>
      <div
        className="grid min-w-0 gap-2"
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
      <div className="flex justify-start">
        <Button size="sm" className="v2-primary-cta h-10 border-0 px-4 shadow-none font-display" onClick={addMember}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Add another team member
        </Button>
      </div>
      <section className="grid gap-2.5 rounded-xl border border-ring/35 bg-gradient-to-br from-ring/10 to-card/40 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-ring" />
          Team tools
        </div>
        <div className="min-w-0">
          <DebateOptionsTable
            maxRounds={value.max_rounds}
            consensusScore={value.consensus_score}
            onMaxRounds={(n) => set("max_rounds", n)}
            onConsensusScore={(n) => set("consensus_score", n)}
          />
        </div>
      </section>
      <p className="m-0 text-[0.85rem] text-muted-foreground">Scorer and summarizer always use Deepseek v3.2.</p>
    </>
  );
}
