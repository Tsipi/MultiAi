import { useState } from "react";
import type { ConsultResult } from "@/types";
import type { TeamMember } from "@/data/experts";
import { attachmentListForDisplay, promptTextForDisplay, stripAttachmentBlock } from "@/lib/promptDisplay";
import { sharedLeadExpertRole } from "@/lib/teamSharedRole";
import { Button } from "@/components/ui/button";
import { CollapsiblePanel } from "../primitives/CollapsiblePanel";
import { SessionPromptActions } from "./SessionPromptActions";
import { SessionAttachmentList } from "./SessionAttachmentList";
import { SessionViewActions } from "./SessionViewActions";
import { PinnedAnswer } from "./PinnedAnswer";
import { TemplateNameChip } from "../team/TemplateNameChip";
import { WebResearchStatus } from "./WebResearchStatus";

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
  onCloseFollowup?: () => void;
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
  onCloseFollowup,
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

      <WebResearchStatus result={result} />

      {/* 2. Previous answer — same card treatment as the Final Answer, with its own score badge */}
      <PinnedAnswer
        label="Previous Answer"
        finalAnswer={result.source_final_answer || "Previous answer unavailable."}
        score={result.source_final_score}
        previewWhenClosed={false}
      />

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
          <div className="rounded-xl border border-violet-500/20 bg-[var(--app-surface)] p-4 shadow-sm">
            {effectiveClarificationReason && (
              <p className="m-0 mb-2 text-sm text-muted-foreground">{effectiveClarificationReason}</p>
            )}
            <p className="m-0 mb-3 whitespace-pre-wrap text-sm font-medium text-foreground">
              {effectiveClarificationQuestion}
            </p>
            {effectiveClarificationResponse && (
              <div className="clarification-answer-card rounded-lg border p-2">
                <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                  Your answer
                </p>
                <p className="m-0 text-sm text-foreground">{effectiveClarificationResponse}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Follow-up compose area — desktop only; mobile uses MobileFollowupSheet */}
      {followupOpen && (
        <div className="hidden md:block rounded-lg border border-violet-500/15 bg-card/50 p-3 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Follow-up task or question
            </label>
            <textarea
              value={followupInstruction || ""}
              onChange={(e) => onFollowupInstructionChange?.(e.target.value)}
              onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300)}
              placeholder="Describe what you want next..."
              disabled={loading}
              className="command-input w-full min-h-[100px] resize-y rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50"
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
              className="command-input w-full min-h-[80px] resize-y rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              className="primary-cta font-display h-10 rounded-xl border-0 px-6 font-semibold shadow-none"
              disabled={loading || !followupInstruction?.trim()}
              onClick={() => onSubmitFollowup?.()}
            >
              {loading ? "Team is working…" : "Send follow-up"}
            </Button>
            {onCloseFollowup && (
              <Button
                type="button"
                variant="ghost"
                className="font-display h-10 rounded-xl px-4 font-semibold"
                disabled={loading}
                onClick={onCloseFollowup}
              >
                Cancel
              </Button>
            )}
            {loading && (
              <p className="text-sm text-muted-foreground m-0 animate-pulse">
                Your team is working on the follow-up…
              </p>
            )}
          </div>
        </div>
      )}

      <SessionAttachmentList files={files} />

      {isSavedAnswer && onAskFollowup && !followupOpen ? (
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            className="font-display h-10 rounded-xl px-6 font-semibold hover:text-violet-800"
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

      <WebResearchStatus result={result} />

      {sharedRole && (
        <div className="rounded-lg border border-violet-500/15 bg-card/50 p-3">
          <p className={`${sectionLabel} mb-1`}>Lead expert role</p>
          <p className="m-0 whitespace-pre-wrap text-sm font-normal leading-relaxed text-muted-foreground">
            {sharedRole}
          </p>
        </div>
      )}

      {effectiveClarificationQuestion ? (
        <div className="rounded-xl border border-violet-500/20 bg-[var(--app-surface)] p-4 shadow-sm">
          <p className={`${sectionLabel} mb-2`}>Clarification</p>
          {effectiveClarificationReason && (
            <p className="m-0 mb-2 text-sm text-muted-foreground">{effectiveClarificationReason}</p>
          )}
          <p className="m-0 mb-3 whitespace-pre-wrap text-sm font-medium text-foreground">{effectiveClarificationQuestion}</p>
          {effectiveClarificationResponse && (
            <div className="clarification-answer-card rounded-lg border p-2">
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
            className="command-input min-h-[120px] w-full resize-y rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="primary-cta border-0"
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

      {/* Follow-up compose area — desktop only; mobile uses MobileFollowupSheet */}
      {followupOpen && (
        <div className="hidden md:block rounded-lg border border-violet-500/15 bg-card/50 p-3 space-y-3">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Follow-up task or question
            </label>
            <textarea
              value={followupInstruction || ""}
              onChange={(e) => onFollowupInstructionChange?.(e.target.value)}
              onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300)}
              placeholder="Describe what you want next..."
              disabled={loading}
              className="command-input w-full min-h-[100px] resize-y rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50"
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
              className="command-input w-full min-h-[80px] resize-y rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              className="primary-cta font-display h-10 rounded-xl border-0 px-6 font-semibold shadow-none"
              disabled={loading || !followupInstruction?.trim()}
              onClick={() => onSubmitFollowup?.()}
            >
              {loading ? "Team is working…" : "Send follow-up"}
            </Button>
            {onCloseFollowup && (
              <Button
                type="button"
                variant="ghost"
                className="font-display h-10 rounded-xl px-4 font-semibold"
                disabled={loading}
                onClick={onCloseFollowup}
              >
                Cancel
              </Button>
            )}
            {loading && (
              <p className="text-sm text-muted-foreground m-0 animate-pulse">
                Your team is working on the follow-up…
              </p>
            )}
          </div>
        </div>
      )}

      <SessionAttachmentList files={files} />

      {isSavedAnswer && onAskFollowup && !followupOpen ? (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            className="font-display h-10 rounded-xl px-6 font-semibold hover:text-violet-800"
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
              Viewing saved answer
            </h2>
            <p className="m-0 text-sm text-muted-foreground">
              Answered by your{" "}
              {teamTemplateName ? <TemplateNameChip name={teamTemplateName} /> : "team"}
              {savedAnswerMetaSuffix(result)}
            </p>
          </div>
          {onStartNewSession && (
            <div className="flex shrink-0 items-center">
              <SessionViewActions
                hasResult={true}
                onNewQuestion={onStartNewSession}
                onOpenInsights={onOpenInsights ?? (() => {})}
                onOpenAdvanced={onOpenAdvanced ?? (() => {})}
              />
            </div>
          )}
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

function savedAnswerMetaSuffix(result: ConsultResult): string {
  const date = result.session_id ? formatSessionDate(result.session_id) : "";
  const rounds = result.full_discussion?.length ?? 0;
  const parts: string[] = [];
  if (date) parts.push(date);
  if (rounds > 0) parts.push(`${rounds} round${rounds !== 1 ? "s" : ""}`);
  return (parts.length ? ` · ${parts.join(" · ")}` : "") + ".";
}

function formatSessionDate(sessionId: string): string {
  const m = sessionId.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/);
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]));
  return d.toLocaleString(undefined, { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
}
