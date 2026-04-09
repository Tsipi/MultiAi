import type { AttachmentInput, ConsultPayload } from "@/types";
import { Input } from "@/components/ui/input";
import { FieldLabelWithTip } from "./FieldLabelWithTip";
import { ComposerAttachmentPanel } from "./ComposerAttachmentPanel";
import { InfoTip } from "./InfoTip";

type Props = {
  value: ConsultPayload;
  attachments: AttachmentInput[];
  onAttachmentsChange: (next: AttachmentInput[]) => void;
  onChange: (next: ConsultPayload) => void;
};

export function ComposerAdvanced(props: Props) {
  const set = <K extends keyof ConsultPayload>(key: K, val: ConsultPayload[K]) =>
    props.onChange({ ...props.value, [key]: val });

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <FieldLabelWithTip
          label="Lead expert role"
          tip="Persona and guardrails shared across models unless a seat overrides."
        />
        <Input
          value={props.value.role}
          maxLength={255}
          placeholder="e.g. You are a creative website app designer."
          onChange={(e) => set("role", e.target.value)}
          className="bg-[var(--v2-elevated)] border-[#ffffff10] text-foreground"
        />
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-center gap-2">
          <FieldLabelWithTip
            label="Context files"
            tip="Optional TXT, PDF, or images merged into the consult (not shown in the command bar)."
          />
          <InfoTip tipAlign="start">Add evidence the team should read before answering.</InfoTip>
        </div>
        <ComposerAttachmentPanel
          attachments={props.attachments}
          onAttachmentsChange={props.onAttachmentsChange}
        />
      </div>
    </div>
  );
}
