import { useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readAttachments, supportedUploadTypes } from "@/services/attachments";
import type { AttachmentInput } from "@/types";
import type { TeamMember } from "@/data/experts";
import { CommandContextFooter } from "./CommandContextFooter";
import { CommandBarHeaderRow } from "./CommandBarHeaderRow";

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
}: Props) {
  const busy = Boolean(disabled || loading);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const addFiles = async (files: FileList | null) => {
    const next = await readAttachments(files);
    if (next.length) onAttachmentsChange([...attachments, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <section className="mx-auto w-full max-w-3xl">
      <CommandBarHeaderRow
        greetingName={greetingName}
        team={team}
        busy={busy}
        onAddTeamMember={onAddTeamMember}
        onOpenAdvanced={onOpenAdvanced}
      />

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
          "rounded-[28px] border border-violet-200/60 bg-[var(--v2-surface)] p-2 pl-3 shadow-[0_8px_32px_rgba(124,58,237,0.08)]",
          "dark:border-violet-500/25 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
        )}
      >
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={busy}
            className="h-10 w-10 shrink-0 rounded-full text-violet-700 hover:bg-violet-500/15"
            aria-label="Add context files"
            onClick={() => fileRef.current?.click()}
          >
            <Plus className="h-5 w-5" strokeWidth={2} />
          </Button>
          <textarea
            className={cn(
              "v2-command-input min-h-[56px] max-h-[220px] flex-1 resize-y rounded-2xl border border-transparent bg-[var(--v2-elevated)] px-3 py-3",
              "text-[17px] font-display font-semibold text-foreground placeholder:text-muted-foreground/55"
            )}
            placeholder="Ask your team…"
            rows={3}
            value={value}
            disabled={busy}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.shiftKey) return;
              e.preventDefault();
              if (!value.trim() || busy) return;
              onSubmit();
            }}
          />
        </div>
      </div>

      <CommandContextFooter
        busy={busy}
        loading={Boolean(loading)}
        valueEmpty={!value.trim()}
        attachments={attachments}
        onSubmit={onSubmit}
        onRemoveAttachment={(idx) => onAttachmentsChange(attachments.filter((_, i) => i !== idx))}
      />
    </section>
  );
}
