import { useState } from "react";
import { ConsultResult } from "../types";
import ReactMarkdown from "react-markdown";
import { ClarificationBox } from "./ClarificationBox";
import { downloadMarkdown, downloadPdf, exportDateLocal } from "../services/exporter";
import { generateTitle } from "../services/api";
import { SessionInsightsDashboard } from "./SessionInsightsDashboard";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { PromptContextTable } from "./PromptContextTable";
import {
  attachmentListForDisplay,
  promptTextForDisplay,
  promptTextForExport,
  stripAttachmentBlock,
} from "@/lib/promptDisplay";
import { FollowupComposer } from "./FollowupComposer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DebateChatBubble, DEBATE_SYSTEM_AVATAR } from "./DebateActivityPrimitives";
import { ChatroomDebateView } from "./ChatroomDebateView";
import { PinnedAnswer } from "./PinnedAnswer";
import type { TeamMember } from "@/data/experts";

type Person = { name: string; avatar: string };

type Props = {
  result: ConsultResult | null;
  showFullDiscussion: boolean;
  loading: boolean;
  /** Suppress the inline feed when a parent already renders it (avoids duplicates). */
  suppressActivityFeed?: boolean;
  activity: string[];
  cast: { writer: Person; criticA: Person; criticB: Person };
  team: TeamMember[];
  maxRounds: number;
  consensusThreshold: number;
  clarificationPrompt: string;
  clarificationReason: string;
  clarificationOptions: string[];
  clarificationChoice: string;
  clarificationOtherText: string;
  onClarificationChoice: (value: string) => void;
  onClarificationOtherText: (value: string) => void;
  onSubmitClarification: () => void;
  followupOpen: boolean;
  followupInstruction: string;
  followupConstraints: string;
  followupChangedSinceOpen: boolean;
  onOpenFollowup: () => void;
  onFollowupInstructionChange: (value: string) => void;
  onFollowupConstraintsChange: (value: string) => void;
  onAdjustFollowupTeam: () => void;
  onSubmitFollowup: () => void;
  onRetryFollowup: () => void;
  onStartFresh: () => void;
  followupError: string;
};

export function ChatPanel(props: Props) {
  const [exportBusy, setExportBusy] = useState(false);
  const {
    result,
    showFullDiscussion,
    loading,
    activity,
    cast,
    team,
    maxRounds,
    consensusThreshold,
  } = props;

  const showActivity = !props.suppressActivityFeed && (loading || activity.length > 0);
  const showClarify = Boolean(props.clarificationPrompt && props.clarificationOptions.length);

  const clarifyBox = (
    <ClarificationBox
      reason={props.clarificationReason}
      question={props.clarificationPrompt}
      options={props.clarificationOptions}
      selected={props.clarificationChoice}
      otherText={props.clarificationOtherText}
      loading={loading}
      onSelect={props.onClarificationChoice}
      onOtherTextChange={props.onClarificationOtherText}
      onSubmit={props.onSubmitClarification}
    />
  );

  const chatroomView = (
    <ChatroomDebateView
      activity={activity}
      cast={cast}
      team={team}
      loading={loading}
      maxRounds={maxRounds}
      consensusThreshold={consensusThreshold}
    />
  );

  // ── No result yet: debate is live or hasn't started ──────────────────────
  if (!result) {
    return (
      <section className="grid gap-4">
        {showActivity ? (
          chatroomView
        ) : (
          <p className="text-sm text-muted-foreground m-0">
            Drop a mission and your squad will brainstorm, roast weak ideas, then ship a cleaner answer.
          </p>
        )}
        {showClarify && clarifyBox}
      </section>
    );
  }

  // ── Result available ──────────────────────────────────────────────────────
  const attachmentsForUi = attachmentListForDisplay(result);

  const runExport = async (kind: "md" | "pdf") => {
    const prompt = promptTextForExport(result);
    const role = result.role || "";
    setExportBusy(true);
    try {
      const title = await generateTitle(prompt, role);
      const exportDate = exportDateLocal();
      const payload = { title, role: result.role, prompt, answer: result.final_answer, exportDate };
      if (kind === "md") downloadMarkdown(payload);
      else downloadPdf(payload);
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <section className="grid gap-4">
      {/* 1. Hero: Final Answer — most prominent */}
      <PinnedAnswer
        finalAnswer={result.final_answer}
        score={result.final_score}
        onDownloadMd={() => void runExport("md")}
        onDownloadPdf={() => void runExport("pdf")}
        exportBusy={exportBusy}
      />

      {/* 2. Summary bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs text-muted-foreground">
        {result.full_discussion.length > 0 && (
          <span>
            {result.full_discussion.length} round
            {result.full_discussion.length !== 1 ? "s" : ""}
          </span>
        )}
        <span>·</span>
        <span>
          Score{" "}
          <span className="font-semibold text-foreground/80">{result.final_score.toFixed(1)}</span>{" "}
          / 10
        </span>
        <span>·</span>
        <span>{result.total_tokens.toLocaleString()} tokens</span>
        <span>·</span>
        <span>${result.total_cost_usd.toFixed(4)}</span>
      </div>

      {/* 3. Clarification (if any) */}
      {showClarify && clarifyBox}

      {/* 4. Debate replay — chatroom */}
      {activity.length > 0 && (
        <CollapsiblePanel title="Live Debate Replay" defaultOpen={false}>
          <div className="-mx-3.5 -mb-3.5">
            <ChatroomDebateView
              activity={activity}
              cast={cast}
              team={team}
              loading={false}
              maxRounds={maxRounds}
              consensusThreshold={consensusThreshold}
            />
          </div>
        </CollapsiblePanel>
      )}

      {/* 5. Director's Cut: full answer/critique text per round */}
      {showFullDiscussion && result.full_discussion.length > 0 && (
        <CollapsiblePanel title="Director's Cut: Full Debate" defaultOpen={false}>
          <div className="grid gap-0">
            {result.full_discussion.map((r, idx) => {
              const roundLabel = String((r.round_num as number) ?? idx + 1);
              const { christy, mark } = splitCritique(String(r.critique ?? ""));
              return (
                <article
                  key={idx}
                  className={cn(
                    "grid gap-2",
                    idx > 0 && "mt-2.5 pt-2.5 border-t border-border/25"
                  )}
                >
                  <strong className="text-sm">Round {roundLabel}</strong>
                  <ol className="list-none m-0 p-0 grid gap-2">
                    <DebateChatBubble
                      id="john"
                      label={cast.writer.name}
                      avatar={cast.writer.avatar}
                      tag={`Round ${roundLabel}`}
                    >
                      <ReactMarkdown>{String(r.answer ?? "")}</ReactMarkdown>
                    </DebateChatBubble>
                    <DebateChatBubble
                      id="christy"
                      label={cast.criticA.name}
                      avatar={cast.criticA.avatar}
                      tag={`Round ${roundLabel}`}
                    >
                      <ReactMarkdown>{christy}</ReactMarkdown>
                    </DebateChatBubble>
                    <DebateChatBubble
                      id="mark"
                      label={cast.criticB.name}
                      avatar={cast.criticB.avatar}
                      tag={`Round ${roundLabel}`}
                    >
                      <ReactMarkdown>{mark}</ReactMarkdown>
                    </DebateChatBubble>
                    <DebateChatBubble
                      id="system"
                      label="Round Summary"
                      avatar={DEBATE_SYSTEM_AVATAR}
                      tag={`Round ${roundLabel}`}
                    >
                      <ReactMarkdown>{String(r.summary ?? "")}</ReactMarkdown>
                    </DebateChatBubble>
                  </ol>
                </article>
              );
            })}
          </div>
        </CollapsiblePanel>
      )}

      {/* 6. Session insights */}
      <SessionInsightsDashboard
        totalCostUsd={result.total_cost_usd}
        totalTokens={result.total_tokens}
        consensusScore={result.final_score}
        modelCosts={result.model_costs}
        sessionId={result.session_id}
      />

      {/* 7. Role & Prompt */}
      <CollapsiblePanel title="Role & Prompt" defaultOpen={false}>
        <PromptContextTable
          role={result.role || ""}
          prompt={promptTextForDisplay(result) || ""}
          files={attachmentsForUi}
        />
      </CollapsiblePanel>

      {/* 8. Follow-up context */}
      {result.is_followup && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
            Context used
          </summary>
          <div className="mt-2 grid gap-2">
            <p className="font-semibold m-0">Original prompt</p>
            <p className="text-muted-foreground line-clamp-3 m-0">
              {stripAttachmentBlock(result.source_prompt || result.question)}
            </p>
            <p className="font-semibold m-0">Previous final answer</p>
            <p className="text-muted-foreground line-clamp-3 m-0">
              {result.source_final_answer ||
                "Previous answer unavailable; follow-up used original prompt only."}
            </p>
            <p className="font-semibold m-0">Follow-up instruction</p>
            <p className="text-muted-foreground m-0">
              {result.followup_instruction || "Not provided."}
            </p>
          </div>
        </details>
      )}

      {/* 9. Follow-up composer */}
      <FollowupComposer
        open={props.followupOpen}
        instruction={props.followupInstruction}
        constraints={props.followupConstraints}
        loading={loading}
        changedSinceOpen={props.followupChangedSinceOpen}
        sourcePrompt={result.source_prompt || result.question}
        sourceAnswer={result.source_final_answer || result.final_answer}
        onOpen={props.onOpenFollowup}
        onInstructionChange={props.onFollowupInstructionChange}
        onConstraintsChange={props.onFollowupConstraintsChange}
        onAdjustTeam={props.onAdjustFollowupTeam}
        onSubmit={props.onSubmitFollowup}
        onStartFresh={props.onStartFresh}
      />

      {props.followupError && (
        <p className="text-sm text-muted-foreground flex items-center gap-2 m-0">
          Follow-up run failed.{" "}
          <Button variant="outline" size="sm" onClick={props.onRetryFollowup}>
            Retry follow-up
          </Button>
        </p>
      )}
    </section>
  );
}

function splitCritique(merged: string): { christy: string; mark: string } {
  const a = merged.match(/\[Critic A\]\s*([\s\S]*?)(?=\[Critic B\]|$)/i)?.[1]?.trim() ?? "";
  const b = merged.match(/\[Critic B\]\s*([\s\S]*)$/i)?.[1]?.trim() ?? "";
  if (!a && !b)
    return { christy: merged, mark: "No separate Mark critique captured in this round." };
  return {
    christy: a || "No separate Christy critique captured in this round.",
    mark: b || "No separate Mark critique captured in this round.",
  };
}
