import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readAttachments, supportedUploadTypes } from "@/services/attachments";
import type { AttachmentInput } from "@/types";
import type { TeamMember } from "@/data/experts";
import type { TeamTemplate } from "@/data/templates";
import { CommandContextFooter } from "./CommandContextFooter";
import { CommandBarHeaderRow } from "./CommandBarHeaderRow";
import { TemplateShortcutRow } from "./TemplateShortcutRow";

type Props = {
  value: string;
  greetingName: string;
  disabled?: boolean;
  loading?: boolean;
  attachments: AttachmentInput[];
  onAttachmentsChange: (next: AttachmentInput[]) => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  team: TeamMember[];
  onAddTeamMember: () => void;
  onOpenAdvanced: () => void;
  activeTemplateId: string | null;
  onSelectTemplate: (template: TeamTemplate) => void;
};

export function CommandBar({
  value,
  greetingName,
  disabled,
  loading,
  attachments,
  onAttachmentsChange,
  onChange,
  onSubmit,
  team,
  onAddTeamMember,
  onOpenAdvanced,
  activeTemplateId,
  onSelectTemplate,
}: Props) {
  const busy = Boolean(disabled || loading);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Gives instant visual feedback on click before the loading prop propagates
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!loading) setSubmitting(false); }, [loading]);
  const isSending = loading || submitting;

  const addFiles = async (files: FileList | null) => {
    const next = await readAttachments(files);
    if (next.length) onAttachmentsChange([...attachments, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!value.trim() || busy) return;
    setSubmitting(true);
    onSubmit();
  };

  return (
    <section className="mx-auto w-full max-w-3xl">
      <CommandBarHeaderRow
        greetingName={greetingName}
        team={team}
        busy={busy}
        showRoles={Boolean(activeTemplateId)}
        onAddTeamMember={onAddTeamMember}
        onOpenAdvanced={onOpenAdvanced}
      />

      <div>
        {/* Input card */}
        <div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            multiple
            accept={supportedUploadTypes()}
            onChange={(e) => void addFiles(e.target.files)}
          />

          <div
            className={cn(
              "rounded-[28px] border border-violet-200/60 bg-[var(--v2-surface)] shadow-[0_8px_32px_rgba(124,58,237,0.08)]",
              "dark:border-violet-500/25 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
              isSending && "opacity-75"
            )}
          >
            {/* Textarea row */}
            <div className="flex items-start gap-2 p-2 pl-3 pb-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={busy}
                className="mt-2 h-10 w-10 shrink-0 rounded-full text-violet-700 hover:bg-violet-500/15"
                aria-label="Add context files"
                title="Attach files"
                onClick={() => fileRef.current?.click()}
              >
                <Plus className="h-5 w-5" strokeWidth={2} />
              </Button>
              <textarea
                id="ask-team-question"
                name="question"
                aria-label="Describe your mission"
                className={cn(
                  "v2-command-input min-h-[130px] max-h-[280px] w-full resize-y rounded-2xl border border-transparent bg-[var(--v2-elevated)] px-3 py-3",
                  "text-[17px] font-display font-semibold text-foreground placeholder:text-muted-foreground/45 placeholder:font-normal"
                )}
                placeholder="Describe the challenge, question, or decision you want your team to tackle…"
                rows={4}
                value={value}
                disabled={busy}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.shiftKey) return;
                  e.preventDefault();
                  handleSubmit();
                }}
              />
            </div>

            {/* Card footer: hint left · send button right */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[11px] text-muted-foreground/40 select-none">
                Enter to run · Shift+Enter new line
              </span>
              <Button
                type="button"
                size="lg"
                disabled={busy || !value.trim()}
                className="v2-primary-cta font-display h-10 rounded-xl border-0 px-5 font-semibold shadow-none"
                onClick={handleSubmit}
              >
                {isSending ? "Mission Initializing…" : "Send to team"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TemplateShortcutRow activeTemplateId={activeTemplateId} onSelect={onSelectTemplate} />
      <CommandContextFooter
        attachments={attachments}
        onRemoveAttachment={(idx) => onAttachmentsChange(attachments.filter((_, i) => i !== idx))}
      />
    </section>
  );
}
