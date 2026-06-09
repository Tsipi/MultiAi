import { useState } from "react";
import type { ConsultResult } from "@/types";
import type { TeamMember } from "@/data/experts";
import { attachmentListForDisplay, promptTextForDisplay, stripAttachmentBlock } from "@/lib/promptDisplay";
import { sharedLeadExpertRole } from "@/lib/teamSharedRole";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { CollapsiblePanel } from "../primitives/CollapsiblePanel";
import { SessionPromptActions } from "./SessionPromptActions";
import { SessionAttachmentList } from "./SessionAttachmentList";
import { SessionViewActions } from "./SessionViewActions";
import { MarkdownView } from "../primitives/MarkdownView";
import { TemplateNameChip } from "../team/TemplateNameChip";

type Props = {
  result: ConsultResult;
  team: TeamMember[];
  loading?: boolean;
  teamTemplateName?: string;
  onResendQuestion: (question: string) => void | Promise<void>;
  onAskFollowup?: () => void;
  onStartNewSession?: () => void;
  onOpenInsights?: () => void;
  onOpenAdvanced?: () => void;
  isSavedAnswer?: boolean;
  clarificationPrompt?: string;
  clarificationReason?: string;
  followupOpen?: boolean;
  followupInstruction?: string;
  followupConstraints?: string;
  onFollowupInstructionChange?: (value: string) => void;
  onFollowupConstraintsChange?: (value: string) => void;
  onSubmitFollowup?: () => void | Promise<void>;
};

export function SessionPromptBlock({
  result,
  team,
  loading,
  teamTemplateName,
  onResendQuestion,
  onAskFollowup,
  onStartNewSession,
  onOpenInsights,
  onOpenAdvanced,
  isSavedAnswer,
  clarificationPrompt,
  clarificationReason,
  followupOpen,
  followupInstruction,
  followupConstraints,
  onFollowupInstructionChange,
  onFollowupConstraintsChange,
  onSubmitFollowup,
}: Props) {
  const prompt = promptTextForDisplay(result).trim();
  const files = attachmentListForDisplay(result);
  const sharedRole = sharedLeadExpertRole(team);
  const useStoredClarification = !clarificationPrompt && Boolean(result.clarification_question && result.clarification_response);
  const effectiveClarificationQuestion = clarificationPrompt || (useStoredClarification ? result.clarification_question : "");
  const effectiveClarificationReason = clarificationReason || (useStoredClarification ? result.clarification_reason : "");
  const effectiveClarificationResponse = useStoredClarification ? result.clarification_response : "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(prompt);
  const [copyText, setCopyText] = useState("Copy");
  if (!prompt && files.length === 0) return null;

  const sectionLabel = "font-display m-0 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300";

  const followupContextContent = (
    <div className="grid gap-4">
      {/* 1. Original question (parent session) */}
      <div className="grid gap-1.5">
        <div className="flex items-baseline gap-2">
          <p className={sectionLabel}>Original question</p>
          {result.parent_session_id && (
            <span className="font-mono text-[0.65rem] text-muted-foreground/55">{result.parent_session_id}</span>
          )}
        </div>
        <p className="m-0 whitespace-pre-wrap text-sm font-semibold leading-snug text-foreground">
          {stripAttachmentBlock(result.source_prompt || result.base_question || result.question)}
        </p>
      </div>

      {/* 2. Previous answer — collapsible to keep the panel compact */}
      <details className="group/prev">
        <summary className="cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden flex items-center justify-between gap-2 hover:opacity-70 transition-opacity">
          <p className={sectionLabel + " pointer-events-none"}>Previous answer</p>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-open/prev:rotate-180" />
        </summary>
        <div className="mt-2 max-h-56 overflow-y-auto">
          <MarkdownView
            content={result.source_final_answer || "Previous answer unavailable."}
            className="border-violet-500/15 bg-card/60 text-sm max-w-none shadow-none"
          />
        </div>
      </details>

      {/* 3. Follow-up instruction (this session) */}
      <div className="grid gap-1.5">
        <div className="flex items-baseline gap-2">
          <p className={sectionLabel}>Follow-up instruction</p>
          {result.session_id && (
            <span className="font-mono text-[0.65rem] text-muted-foreground/55">{result.session_id}</span>
          )}
        </div>
        <p className="m-0 whitespace-pre-wrap text-sm font-semibold leading-snug text-foreground">
          {result.followup_instruction || "Not provided."}
        </p>
      </div>

      {/* 4. Clarification Q&A (stored in result, from a prior clarification step) */}
      {useStoredClarification && effectiveClarificationQuestion ? (
        <div className="grid gap-1.5">
          <p className={sectionLabel}>Clarification</p>
          <div className="rounded-xl border border-violet-500/20 bg-[var(--v2-surface)] p-4 shadow-sm">
            {effectiveClarificationReason && (
              <p className="m-0 mb-2 text-sm text-muted-foreground">{effectiveClarificationReason}</p>
            )}
            <p className="m-0 mb-3 whitespace-pre-wrap text-sm font-medium text-foreground">
              {effectiveClarificationQuestion}
            </p>
            {effectiveClarificationResponse && (
              <div className="rounded-lg border border-violet-400/30 bg-violet-500/5 p-2">
                <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                  Your answer
                </p>
                <p className="m-0 text-sm text-foreground">{effectiveClarificationResponse}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Follow-up compose area (open when user clicks Ask follow-up) */}
      {followupOpen && (
        <div className="rounded-lg border border-violet-500/15 bg-card/50 p-3 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Follow-up task or question
            </label>
            <textarea
              value={followupInstruction || ""}
              onChange={(e) => onFollowupInstructionChange?.(e.target.value)}
              placeholder="Describe what you want next..."
              disabled={loading}
              className="v2-command-input w-full min-h-[100px] resize-y rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Extra constraints (optional)
            </label>
            <textarea
              value={followupConstraints || ""}
              onChange={(e) => onFollowupConstraintsChange?.(e.target.value)}
              placeholder="Add any additional constraints or requirements..."
              disabled={loading}
              className="v2-command-input w-full min-h-[80px] resize-y rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              className="v2-primary-cta font-display h-10 rounded-xl border-0 px-6 font-semibold shadow-none"
              disabled={loading || !followupInstruction?.trim()}
              onClick={() => onSubmitFollowup?.()}
            >
              {loading ? "Team is working…" : "Send follow-up"}
            </Button>
            {loading && (
              <p className="text-sm text-muted-foreground m-0 animate-pulse">
                Your team is working on the follow-up…
              </p>
            )}
          </div>
        </div>
      )}

      <SessionAttachmentList files={files} />

      {isSavedAnswer && onAskFollowup ? (
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            className="font-display h-10 rounded-xl px-6 font-semibold"
            onClick={onAskFollowup}
          >
            Ask follow-up
          </Button>
        </div>
      ) : null}
    </div>
  );

  const standardContent = (
    <div className="grid gap-4">
      {prompt ? (
        <p className="m-0 whitespace-pre-wrap text-base font-semibold leading-snug text-foreground">
          {prompt}
        </p>
      ) : null}

      {sharedRole && (
        <div className="rounded-lg border border-violet-500/15 bg-card/50 p-3">
          <p className={`${sectionLabel} mb-1`}>Lead expert role</p>
          <p className="m-0 whitespace-pre-wrap text-sm font-normal leading-relaxed text-muted-foreground">
            {sharedRole}
          </p>
        </div>
      )}

      {effectiveClarificationQuestion ? (
        <div className="rounded-xl border border-violet-500/20 bg-[var(--v2-surface)] p-4 shadow-sm">
          <p className={`${sectionLabel} mb-2`}>Clarification</p>
          {effectiveClarificationReason && (
            <p className="m-0 mb-2 text-sm text-muted-foreground">{effectiveClarificationReason}</p>
          )}
          <p className="m-0 mb-3 whitespace-pre-wrap text-sm font-medium text-foreground">{effectiveClarificationQuestion}</p>
          {effectiveClarificationResponse && (
            <div className="rounded-lg border border-violet-400/30 bg-violet-500/5 p-2">
              <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                Your answer
              </p>
              <p className="m-0 text-sm text-foreground">{effectiveClarificationResponse}</p>
            </div>
          )}
        </div>
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

      {followupOpen && (
        <div className="rounded-lg border border-violet-500/15 bg-card/50 p-3 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Follow-up task or question
            </label>
            <textarea
              value={followupInstruction || ""}
              onChange={(e) => onFollowupInstructionChange?.(e.target.value)}
              placeholder="Describe what you want next..."
              disabled={loading}
              className="v2-command-input w-full min-h-[100px] resize-y rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Extra constraints (optional)
            </label>
            <textarea
              value={followupConstraints || ""}
              onChange={(e) => onFollowupConstraintsChange?.(e.target.value)}
              placeholder="Add any additional constraints or requirements..."
              disabled={loading}
              className="v2-command-input w-full min-h-[80px] resize-y rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              className="v2-primary-cta font-display h-10 rounded-xl border-0 px-6 font-semibold shadow-none"
              disabled={loading || !followupInstruction?.trim()}
              onClick={() => onSubmitFollowup?.()}
            >
              {loading ? "Team is working…" : "Send follow-up"}
            </Button>
            {loading && (
              <p className="text-sm text-muted-foreground m-0 animate-pulse">
                Your team is working on the follow-up…
              </p>
            )}
          </div>
        </div>
      )}

      <SessionAttachmentList files={files} />

      {isSavedAnswer && onAskFollowup ? (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            className="font-display h-10 rounded-xl px-6 font-semibold"
            onClick={onAskFollowup}
          >
            Ask follow-up
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <section className="grid gap-2">
      {isSavedAnswer ? (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                Viewing saved answer
              </h2>
              {teamTemplateName && <TemplateNameChip name={teamTemplateName} />}
            </div>
            <p className="text-sm text-muted-foreground">
              This answer is from a previous run{result.session_id ? <> (session <span className="font-mono">{result.session_id}</span>)</> : ""}.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
            {onStartNewSession && (
              <SessionViewActions
                hasResult={true}
                onNewQuestion={onStartNewSession}
                onOpenInsights={onOpenInsights ?? (() => {})}
                onOpenAdvanced={onOpenAdvanced ?? (() => {})}
              />
            )}
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
            {result.is_followup ? followupContextContent : standardContent}
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
