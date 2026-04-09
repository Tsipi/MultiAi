import { Settings2, X } from "lucide-react";
import type { AttachmentInput, ConsultPayload } from "@/types";
import { TeamMember } from "@/data/experts";
import { cn } from "@/lib/utils";
import { ComposerAdvanced } from "./ComposerAdvanced";
import { DebateSettings } from "./DebateSettings";
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
          "absolute right-0 top-0 h-full w-full max-w-[560px] overflow-y-auto border-l border-[#ffffff10]",
          "bg-[var(--v2-surface)] shadow-[0_0_40px_rgba(0,0,0,0.35)]"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#ffffff10] bg-[var(--v2-elevated)] px-4 py-3">
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
        <div className="grid gap-4 p-4">
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
            className="v2-primary-cta font-display h-11 border-0 shadow-none w-full sm:w-auto"
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
