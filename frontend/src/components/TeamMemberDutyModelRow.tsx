import { MODEL_OPTIONS } from "../data/models";
import { TeamMember } from "../data/experts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldLabelWithTip } from "./FieldLabelWithTip";

type Props = { member: TeamMember; onUpdate: (next: TeamMember) => void; compact?: boolean };

export function TeamMemberDutyModelRow({ member, onUpdate, compact }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="grid gap-1">
        <FieldLabelWithTip
          compact={compact}
          label="Seat"
          tip="Writer produces and refines the answer. Critics challenge it each round before scoring."
        />
        <Select value={member.duty} onValueChange={(v) => onUpdate({ ...member, duty: v as "writer" | "critic" })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="writer">Writer</SelectItem>
            <SelectItem value="critic">Critic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <FieldLabelWithTip
          compact={compact}
          label="LLM"
          tip="OpenRouter model for this seat. Scorer and summarizer always use Deepseek v3.2."
        />
        <Select value={member.model} onValueChange={(v) => onUpdate({ ...member, model: v })}>
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
      </div>
    </div>
  );
}
