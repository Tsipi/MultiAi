import { Settings2, X } from "lucide-react";
import { useEffect } from "react";
import type { AttachmentInput, ConsultPayload } from "@/types";
import { TeamMember } from "@/data/experts";
import { cn } from "@/lib/utils";
import { ComposerAdvanced } from "../compose/ComposerAdvanced";
import { DebateSettings } from "../primitives/DebateSettings";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ConsultPayload;
  team: TeamMember[];
  attachments: AttachmentInput[];
  loading: boolean;
  canSubmit: boolean;
  onFormChange: (next: ConsultPayload) => void;
  onTeamChange: (next: TeamMember[]) => void;
  onAttachmentsChange: (next: AttachmentInput[]) => void;
  onSubmit: () => void;
};

export function AdvancedDrawer({
  open,
  onOpenChange,
  form,
  team,
  attachments,
  loading,
  canSubmit,
  onFormChange,
  onTeamChange,
  onAttachmentsChange,
  onSubmit,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close advanced setup"
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          "overflow-y-auto overflow-x-hidden bg-[var(--app-surface)] shadow-[0_0_40px_rgba(0,0,0,0.35)]",
          // Mobile: bottom sheet
          "max-md:absolute max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:max-h-[92vh] max-md:rounded-t-2xl max-md:border-t max-md:border-border",
          // Desktop: right panel
          "md:absolute md:right-0 md:top-0 md:h-full md:w-full md:max-w-[560px] md:border-l md:border-border"
        )}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-[var(--app-elevated)] px-4 py-3">
          <div className="min-w-0">
            <p className="m-0 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
              <Settings2 className="h-4 w-4 shrink-0 text-violet-400" aria-hidden />
              Advanced setup
            </p>
            <p className="m-0 text-xs text-muted-foreground">Role, files, debate rounds, team and models</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid min-w-0 gap-4 p-4">
          <ComposerAdvanced
            value={form}
            attachments={attachments}
            onAttachmentsChange={onAttachmentsChange}
            onChange={onFormChange}
          />
          <DebateSettings value={form} team={team} onChange={onFormChange} onTeamChange={onTeamChange} />
          <Button
            type="button"
            size="lg"
            className="primary-cta font-display h-11 border-0 shadow-none w-full sm:w-auto"
            disabled={loading || !canSubmit}
            onClick={onSubmit}
          >
            {loading ? "Team is running…" : "Send to team"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
