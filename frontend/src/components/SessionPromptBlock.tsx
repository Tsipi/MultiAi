import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ConsultResult } from "@/types";
import type { TeamMember } from "@/data/experts";
import { attachmentListForDisplay, promptTextForDisplay } from "@/lib/promptDisplay";
import { sharedLeadExpertRole } from "@/lib/teamSharedRole";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SessionPromptActions } from "./SessionPromptActions";
import { SessionAttachmentList } from "./SessionAttachmentList";

type Props = {
  result: ConsultResult;
  team: TeamMember[];
  loading?: boolean;
  onResendQuestion: (question: string) => void | Promise<void>;
};

export function SessionPromptBlock({
  result,
  team,
  loading,
  onResendQuestion,
}: Props) {
  const prompt = promptTextForDisplay(result).trim();
  const files = attachmentListForDisplay(result);
  const sharedRole = sharedLeadExpertRole(team);
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(prompt);
  const [copyText, setCopyText] = useState("Copy");
  if (!prompt && files.length === 0) return null;

  return (
    <section className="grid gap-2">
      <div className="flex justify-end">
        <div
          className={cn(
            "w-full max-w-[880px] rounded-2xl border border-violet-300/45 bg-[var(--v2-elevated)] p-4",
            "shadow-[0_2px_10px_rgba(124,58,237,0.08)]"
          )}
        >
          <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left">
            <h3 className="font-display m-0 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
              Question
            </h3>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
          {open ? (
            <div className="mt-2">
              {!editing && prompt ? (
                <p className="m-0 whitespace-pre-wrap text-base font-semibold leading-snug text-foreground">{prompt}</p>
              ) : null}
              {editing ? (
                <div className="grid gap-2">
                  <textarea
                    id="resend-question-textarea"
                    name="resend_question"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="v2-command-input min-h-[120px] w-full resize-y rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground"
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} disabled={loading}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="v2-primary-cta border-0"
                      disabled={loading || !draft.trim()}
                      onClick={async () => {
                        await onResendQuestion(draft);
                        setEditing(false);
                      }}
                    >
                      {loading ? "Sending..." : "Resend"}
                    </Button>
                  </div>
                </div>
              ) : null}
              {prompt && sharedRole ? (
                <div className="mt-3 border-t border-violet-500/15 pt-3">
                  <p className="font-display m-0 mb-1 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                    Lead Expert Role
                  </p>
                  <p className="m-0 whitespace-pre-wrap text-sm font-normal leading-relaxed text-muted-foreground">{sharedRole}</p>
                </div>
              ) : null}
              <SessionAttachmentList files={files} />
            </div>
          ) : null}
        </div>
      </div>
      {!editing && (
        <SessionPromptActions
          copyText={copyText}
          onCopy={async () => {
            await navigator.clipboard.writeText(prompt);
            setCopyText("Copied");
            window.setTimeout(() => setCopyText("Copy"), 900);
          }}
          onEdit={() => setEditing(true)}
        />
      )}
    </section>
  );
}
