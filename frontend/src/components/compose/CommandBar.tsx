import { useEffect, useRef, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readAttachments, supportedUploadTypes } from "@/services/attachments";
import type { AttachmentInput } from "@/types";
import type { TeamMember } from "@/data/experts";
import type { TeamTemplate } from "@/data/templates";
import { CommandContextFooter } from "./CommandContextFooter";
import { CommandBarHeaderRow } from "./CommandBarHeaderRow";
import { TemplateShortcutRow } from "../team/TemplateShortcutRow";

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
              "rounded-[28px] border border-violet-200/60 bg-[var(--app-surface)] shadow-[0_8px_32px_rgba(124,58,237,0.08)]",
              "dark:border-violet-500/25 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
              isSending && "opacity-75"
            )}
          >
            {/* Textarea row */}
            <div className="flex items-start gap-2 p-2 pl-3 pb-0">
              {/* Attach button — desktop only; on mobile it moves to the footer */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={busy}
                className="mt-2 hidden min-h-[44px] min-w-[44px] shrink-0 rounded-full text-violet-700 hover:bg-violet-500/15 md:inline-flex"
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
                  "command-input min-h-[130px] max-h-[280px] w-full resize-y rounded-2xl border border-transparent bg-[var(--app-elevated)] px-3 py-3",
                  "text-[17px] font-display font-semibold text-foreground placeholder:text-muted-foreground/45 placeholder:font-normal"
                )}
                placeholder="Ask your team anything…"
                rows={4}
                value={value}
                disabled={busy}
                onChange={(e) => onChange(e.target.value)}
                onFocus={(e) => {
                  setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300);
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.shiftKey) return;
                  e.preventDefault();
                  handleSubmit();
                }}
              />
              {/* Advanced settings button — mobile only, sits at top-right of the textarea row */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={busy}
                className="mt-1 min-h-[44px] min-w-[44px] shrink-0 rounded-full text-muted-foreground hover:bg-violet-500/15 hover:text-violet-700 md:hidden"
                aria-label="Advanced settings"
                title="Advanced settings"
                onClick={onOpenAdvanced}
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>

            {/* Card footer: attach (mobile) + hint (desktop) left · send button right */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-1">
                {/* Attach button — mobile only, moved from textarea row */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={busy}
                  className="min-h-[44px] min-w-[44px] shrink-0 rounded-full text-violet-700 hover:bg-violet-500/15 md:hidden"
                  aria-label="Add context files"
                  title="Attach files"
                  onClick={() => fileRef.current?.click()}
                >
                  <Plus className="h-5 w-5" strokeWidth={2} />
                </Button>
                <span className="hidden text-[11px] text-muted-foreground/40 select-none sm:inline">
                  Enter to run · Shift+Enter new line
                </span>
              </div>
              <Button
                type="button"
                size="lg"
                disabled={busy || !value.trim()}
                className="primary-cta font-display h-10 rounded-xl border-0 px-5 font-semibold shadow-none"
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
