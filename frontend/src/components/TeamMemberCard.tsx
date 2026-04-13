import { FACE_OPTIONS, TeamMember } from "../data/experts";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldLabelWithTip } from "./FieldLabelWithTip";
import { TeamMemberDutyModelRow } from "./TeamMemberDutyModelRow";
import { ActionGhostButton } from "./ActionGhostButton";

type Props = {
  member: TeamMember;
  baseRole: string;
  canRemove: boolean;
  onUpdate: (next: TeamMember) => void;
  onRemove: () => void;
};

export function TeamMemberCard({ member, baseRole, canRemove, onUpdate, onRemove }: Props) {
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
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-full text-foreground hover:bg-rose-500/10 hover:text-rose-600"
          title="Remove this team member from this session of questions"
          aria-label="Remove team member from this session"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
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
      <div className="flex flex-wrap justify-start gap-1.5">
        <ActionGhostButton onClick={() => onUpdate({ ...member, role: baseRole, lockToBaseRole: true })}>
          Adopt main expert style
        </ActionGhostButton>
      </div>
    </article>
  );
}
