import { MODEL_OPTIONS } from "../data/models";
import { TeamMember } from "../data/experts";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { FieldLabelWithTip } from "./FieldLabelWithTip";
import { ModelProviderIcon } from "./ModelProviderIcon";

type Props = { member: TeamMember; onUpdate: (next: TeamMember) => void; compact?: boolean };

export function TeamMemberDutyModelRow({ member, onUpdate, compact }: Props) {
  const selectedModel = MODEL_OPTIONS.find((m) => m.id === member.model);
  return (
    <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 gap-2 sm:grid-cols-2"}>
      <div className="grid min-w-0 gap-1">
        <FieldLabelWithTip
          compact={compact}
          label="Seat"
          tip="Writer produces and refines. Critics challenge the answer before scoring."
        />
        <Select value={member.duty} onValueChange={(v) => onUpdate({ ...member, duty: v as "writer" | "critic" })}>
          <SelectTrigger>
            <span className="truncate">{member.duty === "writer" ? "Writer" : "Critic"}</span>
          </SelectTrigger>
          <SelectContent className="z-[140]">
            <SelectItem value="writer">Writer</SelectItem>
            <SelectItem value="critic">Critic</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid min-w-0 gap-1">
        <FieldLabelWithTip compact={compact} label="LLM" tip="Scorer and summarizer always stay Deepseek v3.2." />
        <Select value={member.model} onValueChange={(v) => onUpdate({ ...member, model: v })}>
          <SelectTrigger>
            <span className="flex min-w-0 items-center gap-2">
              <ModelProviderIcon modelId={member.model} title={member.model} />
              <span className="ml-1 truncate">{selectedModel?.label ?? member.model}</span>
            </span>
          </SelectTrigger>
          <SelectContent className="z-[140]">
            {MODEL_OPTIONS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex min-w-0 items-center gap-2">
                  <ModelProviderIcon modelId={m.id} title={m.id} />
                  <span className="ml-1 truncate">{m.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
