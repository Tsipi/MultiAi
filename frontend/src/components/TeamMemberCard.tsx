import { FACE_OPTIONS, TeamMember } from "../data/experts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldLabelWithTip } from "./FieldLabelWithTip";
import { TeamMemberDutyModelRow } from "./TeamMemberDutyModelRow";

type Props = {
  member: TeamMember;
  baseRole: string;
  canRemove: boolean;
  onUpdate: (next: TeamMember) => void;
  onRemove: () => void;
};

export function TeamMemberCard({ member, baseRole, canRemove, onUpdate, onRemove }: Props) {
  const profile = FACE_OPTIONS.find((f) => f.name === member.name);
  const chooseMember = (name: string) => {
    const face = FACE_OPTIONS.find((f) => f.name === name);
    if (!face) return;
    onUpdate({ ...member, name: face.name, avatar: face.avatar, expertiseTag: face.expertiseTag });
  };

  return (
    <article className="grid min-w-0 gap-2.5 rounded-xl border border-border/65 bg-card/40 p-2.5">
      <div className="flex items-start gap-2">
        <img
          src={member.avatar}
          className="h-9 w-9 shrink-0 rounded-full border-2 border-ring/35 object-cover"
          alt={member.name}
        />
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="grid gap-1">
            <FieldLabelWithTip
              compact
              label="Team member"
              tip="Persona for display. The LLM field sets which model actually responds."
            />
            <Select value={member.name} onValueChange={chooseMember}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FACE_OPTIONS.map((f) => (
                  <SelectItem key={f.name} value={f.name}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="m-0 line-clamp-1 text-[0.68rem] font-semibold uppercase tracking-wider text-ring/70">
            {member.expertiseTag || "Short tag"}
          </p>
          {profile && (
            <p
              className="m-0 line-clamp-2 text-[0.7rem] font-normal leading-snug text-muted-foreground italic"
              title={profile.funFact}
            >
              {profile.funFact}
            </p>
          )}
        </div>
      </div>
      <TeamMemberDutyModelRow compact member={member} onUpdate={onUpdate} />
      <div className="grid gap-1">
        <FieldLabelWithTip
          compact
          label="What this team member is great at"
          tip="Optional focus for this seat. Empty uses the main Lead Expert Role from the composer."
        />
        <Input
          value={member.role}
          placeholder={baseRole || "e.g. You are an expert in growth strategy for B2B SaaS."}
          onChange={(e) => onUpdate({ ...member, role: e.target.value, lockToBaseRole: false })}
        />
      </div>
      <div className="flex flex-wrap justify-between gap-1.5">
        <Button
          type="button"
          variant="sync"
          size="sm"
          className="border-0 bg-violet-500/12 text-violet-200 shadow-none hover:bg-violet-500/20"
          onClick={() => onUpdate({ ...member, role: baseRole, lockToBaseRole: true })}
        >
          Adopt main expert style
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-0 bg-rose-500/10 text-rose-300 shadow-none hover:bg-rose-500/15"
          disabled={!canRemove}
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
    </article>
  );
}
