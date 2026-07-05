import { UserPlus, Users } from "lucide-react";
import type { ConsultPayload } from "@/types";
import type { TeamMember } from "@/data/experts";
import { appendDefaultTeamMember } from "@/lib/teamRoster";
import { Button } from "@/components/ui/button";
import { V2SectionHeader } from "@/components/primitives/V2SectionHeader";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { FieldLabelWithTip } from "@/components/primitives/FieldLabelWithTip";
import { Input } from "@/components/ui/input";

type Props = {
  form: ConsultPayload;
  team: TeamMember[];
  onFormChange: (next: ConsultPayload) => void;
  onTeamChange: (next: TeamMember[]) => void;
};

export function AdvancedTabTeam({ form, team, onFormChange, onTeamChange }: Props) {
  const updateMember = (idx: number, next: TeamMember) =>
    onTeamChange(team.map((m, i) => (i === idx ? next : m)));

  const addMember = () => onTeamChange(appendDefaultTeamMember(team, form.role));

  return (
    <div className="grid gap-5">
      <V2SectionHeader
        eyebrow="Your AI team"
        subtitle="Build your dream team: add Writers and Critics, each with their own model, name, and area of focus. They'll debate your question round by round until they reach a consensus."
        tip="Tap any member card to edit name, seat, model, and focus."
      />

      <div className="grid gap-1.5">
        <FieldLabelWithTip
          label="Lead expert role"
          tip="Persona and guardrails shared across all team members unless a seat overrides it."
        />
        <Input
          value={form.role}
          maxLength={255}
          placeholder="e.g. You are a creative website app designer."
          onChange={(e) => onFormChange({ ...form, role: e.target.value })}
          className="bg-[var(--app-elevated)] border-border text-foreground"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
          Team members
        </div>
        <div
          className="grid min-w-0 gap-2"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 192px), 1fr))" }}
        >
          {team.map((member, idx) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              baseRole={form.role}
              canRemove={team.length > 1}
              onUpdate={(next) => updateMember(idx, next)}
              onRemove={() => onTeamChange(team.filter((_, i) => i !== idx))}
            />
          ))}
        </div>
      </div>

      <Button
        size="sm"
        className="primary-cta h-10 w-full border-0 px-4 shadow-none font-display"
        onClick={addMember}
      >
        <UserPlus className="mr-1.5 h-4 w-4" />
        Add another team member
      </Button>
    </div>
  );
}
