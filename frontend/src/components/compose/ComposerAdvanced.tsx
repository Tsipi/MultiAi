import type { AttachmentInput, ConsultPayload } from "@/types";
import { Input } from "@/components/ui/input";
import { FieldLabelWithTip } from "../primitives/FieldLabelWithTip";
import { ComposerAttachmentPanel } from "./ComposerAttachmentPanel";
import { InfoTip } from "../primitives/InfoTip";
import { V2SectionHeader } from "../primitives/V2SectionHeader";

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
      <V2SectionHeader
        eyebrow="Your AI team"
        subtitle="Build your dream team: add Writers and Critics, each with their own model, name, and area of focus. They'll debate your question round by round until they reach a consensus."
        tip="Double-click any roster card to edit name, seat, model, and strengths."
      />
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
          className="bg-[var(--app-elevated)] border-border text-foreground"
        />
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-center gap-2">
          <FieldLabelWithTip
            label="Context files"
            tip="Optional TXT, PDF, or images merged into the consult; chips appear under the main prompt when attached."
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
