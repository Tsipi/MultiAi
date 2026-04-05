import { MODEL_OPTIONS } from "../data/models";
import { FACE_OPTIONS, TeamMember, findFaceByName } from "../data/experts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  member: TeamMember;
  baseRole: string;
  canRemove: boolean;
  onUpdate: (next: TeamMember) => void;
  onRemove: () => void;
};

export function TeamMemberCard({ member, baseRole, canRemove, onUpdate, onRemove }: Props) {
  const profile = findFaceByName(member.name);

  const chooseMember = (name: string) => {
    const face = findFaceByName(name);
    onUpdate({ ...member, name: face.name, avatar: face.avatar });
  };

  return (
    <article className="border border-border rounded-lg bg-card/90 p-3 grid gap-3">
      {/* Avatar + persona selectors */}
      <div className="flex gap-3 items-start">
        <img
          src={member.avatar}
          className="w-10 h-10 rounded-full object-cover border-2 border-ring/35 flex-shrink-0"
          alt={member.name}
        />
        <div className="flex-1 grid gap-2 min-w-0">
          <Label title="Choose a team persona for this seat.">
            Team member
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
          </Label>
          <p className="text-[0.77rem] font-bold uppercase tracking-wider text-ring/70 m-0">
            {profile.expertiseTag}
          </p>
          <p className="text-[0.76rem] leading-relaxed text-foreground/75 italic m-0">
            {profile.funFact}
          </p>
        </div>
      </div>

      {/* Seat + LLM selectors */}
      <div className="grid grid-cols-2 gap-2.5">
        <Label title="Writer drafts and refines the answer. Critics challenge and improve it.">
          Seat
          <Select
            value={member.duty}
            onValueChange={(v) => onUpdate({ ...member, duty: v as "writer" | "critic" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="writer">Writer</SelectItem>
              <SelectItem value="critic">Critic</SelectItem>
            </SelectContent>
          </Select>
        </Label>
        <Label title="The AI model powering this team member.">
          LLM
          <Select
            value={member.model}
            onValueChange={(v) => onUpdate({ ...member, model: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label} ({m.cost})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
      </div>

      {/* Role input */}
      <Label title="Describe what this expert specialises in. Leave blank to use the main expert role.">
        What this team member is great at
        <Input
          value={member.role}
          placeholder={baseRole || "e.g. You are an expert in growth strategy for B2B SaaS."}
          onChange={(e) => onUpdate({ ...member, role: e.target.value, lockToBaseRole: false })}
        />
      </Label>

      {/* Actions */}
      <div className="flex justify-between gap-2">
        <Button
          type="button"
          variant="sync"
          size="sm"
          onClick={() => onUpdate({ ...member, role: baseRole, lockToBaseRole: true })}
        >
          Adopt main expert style
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={!canRemove}
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
    </article>
  );
}
