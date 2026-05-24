import { useEffect, useRef, useState } from "react";
import { ConsultResult } from "../types";
import ReactMarkdown from "react-markdown";
import { ClarificationBox } from "./ClarificationBox";
import { downloadMarkdown, downloadPdf, exportDateLocal } from "../services/exporter";
import { generateTitle } from "../services/api";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { promptTextForExport } from "@/lib/promptDisplay";
import { FollowupComposer } from "./FollowupComposer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DebateChatBubble, DEBATE_SYSTEM_AVATAR } from "./DebateActivityPrimitives";
import { ChatroomDebateView } from "./ChatroomDebateView";
import { PinnedAnswer } from "./PinnedAnswer";
import { SessionPromptBlock } from "./SessionPromptBlock";
import { SessionPromptDownloads } from "./SessionPromptDownloads";
import type { TeamMember } from "@/data/experts";
import { MODEL_OPTIONS } from "@/data/models";

type Person = { name: string; avatar: string; model: string };

type Props = {
  result: ConsultResult | null;
  showFullDiscussion: boolean;
  loading: boolean;
  /** Suppress the inline feed when a parent already renders it (avoids duplicates). */
  suppressActivityFeed?: boolean;
  activity: string[];
  cast: { writer: Person; critics: Person[] };
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
  onResendQuestion: (question: string) => void | Promise<void>;
  isSavedAnswer?: boolean;
  onAskFollowup?: () => void;
  onStartNewSession?: () => void;
};

export function ChatPanel(props: Props) {
  const [exportBusy, setExportBusy] = useState(false);
  const followupRef = useRef<HTMLDivElement>(null);
  const clarificationRef = useRef<HTMLDivElement>(null);
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

  // Scroll to the follow-up composer whenever it opens
  useEffect(() => {
    if (props.followupOpen) {
      followupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [props.followupOpen]);

  // Scroll to the clarification box when it appears mid-session (e.g. after a follow-up)
  useEffect(() => {
    if (showClarify) {
      clarificationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showClarify]);

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
        {showClarify && (
          <div ref={clarificationRef} className="scroll-mt-20">
            {clarifyBox}
          </div>
        )}
        {showActivity ? (
          chatroomView
        ) : (
          !showClarify && (
            <p className="text-sm text-muted-foreground m-0">
              Drop a mission and your squad will brainstorm, roast weak ideas, then ship a cleaner answer.
            </p>
          )
        )}
      </section>
    );
  }

  // ── Result available ──────────────────────────────────────────────────────
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
      {/* Main content: Question, answer, discussion */}
      <div className="grid gap-4">
        <SessionPromptBlock
          result={result}
          team={team}
          loading={loading}
          onResendQuestion={props.onResendQuestion}
          isSavedAnswer={Boolean(result)}
          onAskFollowup={props.onAskFollowup}
          onStartNewSession={props.onStartNewSession}
          clarificationPrompt={props.clarificationPrompt}
          clarificationReason={props.clarificationReason}
          followupOpen={props.followupOpen}
          followupInstruction={props.followupInstruction}
          followupConstraints={props.followupConstraints}
          onFollowupInstructionChange={props.onFollowupInstructionChange}
          onFollowupConstraintsChange={props.onFollowupConstraintsChange}
          onSubmitFollowup={props.onSubmitFollowup}
        />

        {/* Clarification box — shown below the Question card when a follow-up triggers ambiguity */}
        {showClarify && (
          <div ref={clarificationRef} className="scroll-mt-20">
            {clarifyBox}
          </div>
        )}

        {/* 1. Hero: Final Answer — most prominent */}
        <div className="flex justify-start">
          <div className="w-full max-w-[880px]">
            <PinnedAnswer
              finalAnswer={result.final_answer}
              score={result.final_score}
              cast={cast}
            />
          </div>
        </div>

        {/* 2. Stats and downloads */}
        <div className="-mt-2 flex justify-start">
          <div className="flex w-full max-w-[880px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SessionPromptDownloads
              exportBusy={exportBusy}
              onCopy={async () => {
                await navigator.clipboard.writeText(result.final_answer || "");
              }}
              onDownloadMd={() => void runExport("md")}
              onDownloadPdf={() => void runExport("pdf")}
            />
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 px-1 text-xs text-muted-foreground">
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
          </div>
        </div>

        {/* 4. Debate replay — chatroom */}
        {activity.length > 0 && (
          <CollapsiblePanel
            title="Live Debate Replay"
            titleClassName="font-display text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300"
            defaultOpen={false}
          >
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
          <CollapsiblePanel
            title="Director's Cut: Full Debate"
            defaultOpen
            titleClassName="font-display text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300"
          >
            <div className="grid gap-0">
              {result.full_discussion.map((r, idx) => {
                const roundLabel = String((r.round_num as number) ?? idx + 1);
                const criticCount = Math.max(
                  result.critic_names?.length ?? 0,
                  cast.critics.length,
                );
                const critiques = splitCritiques(String(r.critique ?? ""), criticCount);
                const writerName = result.writer_names?.[0] || cast.writer.name;
                return (
                  <article
                    key={idx}
                    className={cn(
                      "grid gap-2",
                      idx > 0 && "mt-2.5 pt-2.5 border-t border-border/25"
                    )}
                  >
                    <strong className="text-sm">Round {roundLabel}</strong>
                    <ol className="list-none m-0 grid gap-2 p-0">
                      <DebateChatBubble
                        id="writer"
                        label={writerName}
                        avatar={cast.writer.avatar}
                        modelId={cast.writer.model}
                        rawText={String(r.answer ?? "")}
                      >
                        <ReactMarkdown>{String(r.answer ?? "")}</ReactMarkdown>
                      </DebateChatBubble>
                      {critiques.map((crit, ci) => {
                        const storedName = result.critic_names?.[ci];
                        const castMember = cast.critics[ci];
                        const modelId = result.model_critics?.[ci] ?? castMember?.model ?? "";
                        const modelLabel = MODEL_OPTIONS.find((o) => o.id === modelId)?.label
                          ?? (modelId.includes("/") ? modelId.split("/").pop()! : modelId);
                        const label = storedName || castMember?.name || modelLabel || crit.label;
                        const avatar = castMember?.avatar ?? DEBATE_SYSTEM_AVATAR;
                        // critic 0 → left, critic 1 → right, critic 2 → left …
                        const criticAlign = ci % 2 === 0 ? "left" : "right";
                        return (
                          <DebateChatBubble
                            key={ci}
                            id={`critic${ci + 1}`}
                            label={label}
                            avatar={avatar}
                            modelId={castMember?.model}
                            rawText={crit.text}
                            align={criticAlign}
                          >
                            <ReactMarkdown>{crit.text}</ReactMarkdown>
                          </DebateChatBubble>
                        );
                      })}
                      <DebateChatBubble
                        id="system"
                        label="Round Summary"
                        avatar={DEBATE_SYSTEM_AVATAR}
                        tag={`Round ${roundLabel}`}
                        rawText={String(r.summary ?? "")}
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

        {props.followupError && (
          <p className="text-sm text-muted-foreground flex items-center gap-2 m-0">
            Follow-up run failed.{" "}
            <Button variant="outline" size="sm" onClick={props.onRetryFollowup}>
              Retry follow-up
            </Button>
          </p>
        )}
      </div>
    </section>
  );
}

/** Split a merged critique block into per-critic sections. */
function splitCritiques(
  merged: string,
  criticCount: number
): { label: string; text: string }[] {
  // Try numbered blocks: [Critic 1], [Critic 2], ...
  const re = /\[Critic (\d+)\]([\s\S]*?)(?=\[Critic \d+\]|$)/gi;
  const parts: { label: string; text: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(merged)) !== null) {
    const text = m[2].trim();
    if (text) parts.push({ label: `Critic ${m[1]}`, text });
  }
  if (parts.length > 0) return parts;

  // Fallback: legacy alphabetic blocks [Critic A], [Critic B], ...
  const letters = ["A", "B", "C", "D", "E", "F"];
  const reLeg = /\[Critic ([A-F])\]([\s\S]*?)(?=\[Critic [A-F]\]|$)/gi;
  while ((m = reLeg.exec(merged)) !== null) {
    const text = m[2].trim();
    if (text) parts.push({ label: `Critic ${m[1]}`, text });
  }
  if (parts.length > 0) return parts;

  // Final fallback: treat the whole block as a single critic
  if (merged.trim()) return [{ label: "Critic 1", text: merged.trim() }];

  // Empty — produce empty slots matching criticCount so layout stays consistent
  return Array.from({ length: Math.max(criticCount, 1) }, (_, i) => ({
    label: `Critic ${i + 1}`,
    text: "",
  }));
}
