import { useEffect, useState } from "react";
import { TeamMember } from "@/data/experts";
import { TeamMemberEditForm } from "./TeamMemberEditForm";

type Props = {
  open: boolean;
  member: TeamMember | null;
  leadRole: string;
  onClose: () => void;
  onSave: (next: TeamMember) => void;
};

export function TeamMemberEditModal({ open, member, leadRole, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (open && member) setDraft({ ...member });
    if (!open) setDraft(null);
  }, [open, member]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const scrollbarComp = window.innerWidth - document.documentElement.clientWidth;
    const originalPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarComp > 0) document.body.style.paddingRight = `${scrollbarComp}px`;
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  if (!open || !member || !draft) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="team-member-edit-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-x-hidden overflow-y-auto rounded-2xl border border-border bg-[var(--app-elevated)] p-4 shadow-xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="team-member-edit-title" className="font-display m-0 mb-1 text-base font-semibold">
          Edit team member
        </h2>
        <p className="mb-3 mt-0 text-xs text-muted-foreground">Double-click a card on the strip to reopen.</p>
        <TeamMemberEditForm
          draft={draft}
          setDraft={setDraft}
          leadRole={leadRole}
          onCancel={onClose}
          onSave={() => {
            onSave(draft);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
