import { useState } from "react";
import type { ConsultResult } from "@/types";
import type { TeamMember } from "@/data/experts";
import { attachmentListForDisplay, promptTextForDisplay } from "@/lib/promptDisplay";
import { sharedLeadExpertRole } from "@/lib/teamSharedRole";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { SessionPromptActions } from "./SessionPromptActions";
import { SessionAttachmentList } from "./SessionAttachmentList";

type Props = {
  result: ConsultResult;
  team: TeamMember[];
  loading?: boolean;
  onResendQuestion: (question: string) => void | Promise<void>;
  onAskFollowup?: () => void;
  onStartNewSession?: () => void;
  isSavedAnswer?: boolean;
};

export function SessionPromptBlock({
  result,
  team,
  loading,
  onResendQuestion,
  onAskFollowup,
  onStartNewSession,
  isSavedAnswer,
}: Props) {
  const prompt = promptTextForDisplay(result).trim();
  const files = attachmentListForDisplay(result);
  const sharedRole = sharedLeadExpertRole(team);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(prompt);
  const [copyText, setCopyText] = useState("Copy");
  if (!prompt && files.length === 0) return null;

  return (
    <section className="grid gap-2">
      {isSavedAnswer ? (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
              Viewing saved answer
            </h2>
            <p className="text-sm text-muted-foreground">
              This answer is from a previous run.
            </p>
          </div>
        </div>
      ) : null}
      <div className="flex justify-start">
        <div className="w-full max-w-[880px]">
          <CollapsiblePanel
            title="Question"
            defaultOpen
            titleClassName="font-display text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300"
          >
            <div className="grid gap-4">
              {prompt ? (
                <p className="m-0 whitespace-pre-wrap text-base font-semibold leading-snug text-foreground">
                  {prompt}
                </p>
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
                  <p className="m-0 whitespace-pre-wrap text-sm font-normal leading-relaxed text-muted-foreground">
                    {sharedRole}
                  </p>
                </div>
              ) : null}
              <SessionAttachmentList files={files} />
              {isSavedAnswer && onAskFollowup ? (
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    className="v2-primary-cta font-display h-11 rounded-xl border-0 px-6 font-semibold shadow-none"
                    onClick={onAskFollowup}
                  >
                    Ask follow-up
                  </Button>
                </div>
              ) : null}
            </div>
          </CollapsiblePanel>
        </div>
      </div>
      {!editing && !isSavedAnswer && (
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
