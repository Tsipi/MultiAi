import { AttachmentInput, ConsultPayload } from "../types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { FieldLabelWithTip } from "./FieldLabelWithTip";
import { InfoTip } from "./InfoTip";
import { ComposerAttachmentPanel } from "./ComposerAttachmentPanel";

type Props = {
  value: ConsultPayload;
  attachments: AttachmentInput[];
  onAttachmentsChange: (next: AttachmentInput[]) => void;
  onChange: (next: ConsultPayload) => void;
};

export function Composer(props: Props) {
  const set = <K extends keyof ConsultPayload>(key: K, val: ConsultPayload[K]) =>
    props.onChange({ ...props.value, [key]: val });

  return (
    <CollapsiblePanel
      defaultOpen
      leading={
        <span className="h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-blue-300 to-green-400 shadow-[0_0_0_3px_rgba(158,199,255,0.25)]" />
      }
      title="Your Question and Files"
      titleEnd={
        <InfoTip tipAlign="center">
          Set the lead expert mindset, describe the task with format and limits, then add optional TXT, PDF, or
          images for context.
        </InfoTip>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <FieldLabelWithTip
            label="Lead expert role"
            tip="One-line persona: tone, expertise, and guardrails for every model in the run."
          />
          <Input
            value={props.value.role}
            maxLength={255}
            placeholder="e.g. You are a product strategy expert who gives practical, no-fluff answers."
            onChange={(e) => set("role", e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <FieldLabelWithTip
            label="Your question or task"
            tip="State the goal clearly: output shape, length, audience, and anything to avoid."
          />
          <Textarea
            value={props.value.question}
            rows={7}
            placeholder="e.g. Give 7 bullet points, max 14 words each, focused on early-stage B2B SaaS."
            onChange={(e) => set("question", e.target.value)}
          />
        </div>
        <ComposerAttachmentPanel
          attachments={props.attachments}
          onAttachmentsChange={props.onAttachmentsChange}
        />
      </div>
    </CollapsiblePanel>
  );
}
