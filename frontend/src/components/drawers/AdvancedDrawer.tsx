import { Settings2, Users, SlidersHorizontal, Database, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { AttachmentInput, ConsultPayload } from "@/types";
import type { TeamMember } from "@/data/experts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AdvancedTabTeam } from "./AdvancedTabTeam";
import { AdvancedTabDebate } from "./AdvancedTabDebate";
import { AdvancedTabSources } from "./AdvancedTabSources";

type Tab = "team" | "debate" | "sources";

const TABS: Array<{ id: Tab; label: string; Icon: React.ElementType }> = [
  { id: "team", label: "Team", Icon: Users },
  { id: "debate", label: "Debate", Icon: SlidersHorizontal },
  { id: "sources", label: "Sources", Icon: Database },
];

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
  const [activeTab, setActiveTab] = useState<Tab>("team");

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
    <div className="fixed inset-0 z-[110]">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close advanced setup"
        onClick={() => onOpenChange(false)}
      />

      <aside
        className={cn(
          "flex flex-col bg-[var(--app-surface)] shadow-[0_0_40px_rgba(0,0,0,0.35)]",
          // Mobile: bottom sheet
          "max-md:absolute max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:max-h-[88vh] max-md:rounded-t-2xl max-md:border-t max-md:border-border",
          // Desktop: right panel
          "md:absolute md:right-0 md:top-0 md:h-full md:w-full md:max-w-[560px] md:border-l md:border-border"
        )}
      >
        {/* Drag handle — mobile only */}
        <div className="flex shrink-0 justify-center pt-3 pb-1 md:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="shrink-0 border-b border-border bg-[var(--app-elevated)] px-4 pt-3 pb-0">
          <div className="flex items-center justify-between gap-3 pb-3">
            <div className="min-w-0">
              <p className="m-0 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                <Settings2 className="h-4 w-4 shrink-0 text-violet-400" aria-hidden />
                Advanced setup
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 pb-0">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
                  activeTab === id
                    ? "border-violet-600 bg-violet-500/10 text-violet-700 dark:border-violet-400 dark:text-violet-300"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                aria-selected={activeTab === id}
                role="tab"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable tab content */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pb-2">
          {activeTab === "team" && (
            <AdvancedTabTeam
              form={form}
              team={team}
              onFormChange={onFormChange}
              onTeamChange={onTeamChange}
            />
          )}
          {activeTab === "debate" && (
            <AdvancedTabDebate form={form} onFormChange={onFormChange} />
          )}
          {activeTab === "sources" && (
            <AdvancedTabSources
              form={form}
              attachments={attachments}
              onFormChange={onFormChange}
              onAttachmentsChange={onAttachmentsChange}
            />
          )}
        </div>

        {/* Pinned Send to team button */}
        <div className="shrink-0 border-t border-border bg-[var(--app-elevated)] p-4">
          <Button
            type="button"
            size="lg"
            className="primary-cta font-display h-11 w-full border-0 shadow-none"
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
