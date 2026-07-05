import type { AttachmentInput, ConsultPayload, WebSearchMode } from "@/types";
import { ComposerAttachmentPanel } from "@/components/compose/ComposerAttachmentPanel";
import { WebResearchControl } from "@/components/primitives/WebResearchControl";

type Props = {
  form: ConsultPayload;
  attachments: AttachmentInput[];
  onFormChange: (next: ConsultPayload) => void;
  onAttachmentsChange: (next: AttachmentInput[]) => void;
};

export function AdvancedTabSources({ form, attachments, onFormChange, onAttachmentsChange }: Props) {
  return (
    <div className="grid gap-4">
      <ComposerAttachmentPanel
        attachments={attachments}
        onAttachmentsChange={onAttachmentsChange}
      />
      <WebResearchControl
        value={form.web_search_mode ?? "auto"}
        onChange={(mode: WebSearchMode) => onFormChange({ ...form, web_search_mode: mode })}
      />
    </div>
  );
}
