import { useEffect, useRef, useState } from "react";
import { MobileFollowupSheet } from "@/components/layout/MobileFollowupSheet";
import { AnswerMode, ConsultResult } from "../../types";
import ReactMarkdown from "react-markdown";
import { ClarificationBox } from "../session/ClarificationBox";
import { downloadMarkdown, downloadPdf, exportDateLocal, type ExportDebateMessage } from "../../services/pdf/exporter";
import { generateTitle } from "../../services/api";
import { CollapsiblePanel } from "../primitives/CollapsiblePanel";
import { promptTextForExport } from "@/lib/promptDisplay";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DebateChatBubble, DEBATE_SYSTEM_AVATAR } from "./DebateActivityPrimitives";
import { ChatroomDebateView } from "./ChatroomDebateView";
import { PinnedAnswer } from "../session/PinnedAnswer";
import { SessionPromptBlock } from "../session/SessionPromptBlock";
import { SessionPromptDownloads } from "../session/SessionPromptDownloads";
import { type TeamMember } from "@/data/experts";
import { MODEL_OPTIONS } from "@/data/models";
import { TEAM_TEMPLATES, roleSummaryFromText } from "@/data/templates";

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
  answerMode: AnswerMode;
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
  teamTemplateName?: string;
  isSavedAnswer?: boolean;
  onAskFollowup?: () => void;
  onStartNewSession?: () => void;
  onOpenInsights?: () => void;
  onOpenAdvanced?: () => void;
  onShareToggle?: () => void | Promise<void>;
  onCloseFollowup?: () => void;
};

export function ChatPanel(props: Props) {
  const [exportBusy, setExportBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [includeFullDebate, setIncludeFullDebate] = useState(false);
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
    answerMode,
  } = props;

  const showActivity = !props.suppressActivityFeed && (loading || activity.length > 0);
  const showClarify = Boolean(props.clarificationPrompt && props.clarificationOptions.length);
  const showPreviousFullDebate = showFullDiscussion && !loading && (result?.full_discussion.length ?? 0) > 0;

  // Scroll to the follow-up composer whenever it opens (desktop inline form)
  useEffect(() => {
    if (props.followupOpen) {
      followupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [props.followupOpen]);

  // Scroll to top when the debate finishes so PinnedAnswer is immediately visible
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading && result) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevLoadingRef.current = loading;
  }, [loading, result]);

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
      answerMode={answerMode}
      teamTemplateName={props.teamTemplateName}
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
        ) : null}
      </section>
    );
  }

  // ── Result available ──────────────────────────────────────────────────────
  const runExport = async (kind: "md" | "pdf") => {
    const prompt = promptTextForExport(result);
    const role = result.role || "";
    setExportBusy(true);
    try {
      // PDF title uses the question text so it reads as a proper document heading.
      const pdfTitle = pdfTitleFromResult(result);
      const exportDate = exportDateLocal();
      const activeTemplate = props.teamTemplateName
        ? TEAM_TEMPLATES.find((t) => t.name === props.teamTemplateName)
        : undefined;
      const roleSummaryFor = (name: string) => {
        const teamMember = team.find((m) => m.name === name);
        const templateMember = activeTemplate?.members.find((m) => m.name === name);
        return roleSummaryFromText(teamMember?.role || templateMember?.role || "");
      };
      const participants = [
        { name: cast.writer.name, role: "Writer" as const, model: cast.writer.model, avatar: cast.writer.avatar },
        ...cast.critics.map((c) => ({ name: c.name, role: "Critic" as const, model: c.model, avatar: c.avatar })),
      ].map((p) => ({ ...p, roleSummary: roleSummaryFor(p.name) }));
      const debateRounds = includeFullDebate
        ? result.full_discussion.map((r, idx) => {
            const criticCount = Math.max(
              result.critic_names?.length ?? 0,
              cast.critics.length,
            );
            const critiques = splitCritiques(String(r.critique ?? ""), criticCount);
            const writerName = result.writer_names?.[0] || cast.writer.name;

            const writerMessage: ExportDebateMessage = {
              name: writerName,
              role: "Writer",
              model: cast.writer.model,
              avatar: cast.writer.avatar,
              text: String(r.answer ?? ""),
            };

            const criticMessages: ExportDebateMessage[] = critiques.map((crit, ci) => {
              const storedName = result.critic_names?.[ci];
              const castMember = cast.critics[ci];
              const modelId = result.model_critics?.[ci] ?? castMember?.model ?? "";
              const modelLabel = MODEL_OPTIONS.find((o) => o.id === modelId)?.label
                ?? (modelId.includes("/") ? modelId.split("/").pop()! : modelId);

              return {
                name: storedName || castMember?.name || modelLabel || "Critic",
                role: "Critic",
                model: modelId,
                avatar: castMember?.avatar ?? DEBATE_SYSTEM_AVATAR,
                text: crit.text,
              };
            });

            return {
              round_num: Number(r.round_num ?? idx + 1),
              writerMessage,
              criticMessages,
              summary: String(r.summary ?? ""),
            };
          })
        : undefined;
      const webResearch = (result.web_search_performed || result.web_search_warning || result.web_search_sources.length)
        ? {
            mode: result.web_search_mode,
            performed: result.web_search_performed,
            query: result.web_search_query,
            retrievedAt: result.web_search_retrieved_at,
            sources: result.web_search_sources,
            warning: result.web_search_warning,
          }
        : undefined;
      const followupExport = result.is_followup
        ? {
            originalPrompt: result.source_prompt || result.root_question || result.base_question || result.question,
            previousFinalAnswer: result.source_final_answer || "",
            revisedAnswerLabel: "Revised Answer",
          }
        : undefined;
      if (kind === "md") {
        // Markdown keeps the short generated title for the downloaded filename.
        const sidebarTitle = await generateTitle(prompt, role);
        downloadMarkdown({ title: sidebarTitle, role: result.role, prompt, answer: result.final_answer, exportDate, debateRounds, webResearch, followup: followupExport });
      } else {
        await downloadPdf({
          title: pdfTitle,
          role: result.role,
          prompt,
          answer: result.final_answer,
          exportDate,
          participants,
          teamName: activeTemplate?.name,
          consensusScore: result.final_score,
          roundCount: result.full_discussion.length,
          totalCostUsd: result.total_cost_usd,
          debateRounds,
          webResearch,
          followup: followupExport,
        });
      }
    } finally {
      setExportBusy(false);
    }
  };

  /** Up to 20 words of the original question — readable as a PDF document heading. */
  function pdfTitleFromResult(r: NonNullable<typeof result>): string {
    const raw = (r.is_followup
      ? r.followup_instruction || r.source_prompt || r.question
      : r.question
    )?.trim().replace(/\s+/g, " ") ?? "";
    const words = raw.split(" ");
    return words.length <= 20 ? raw : words.slice(0, 20).join(" ") + "…";
  }

  return (
    <>
    <MobileFollowupSheet
      isOpen={props.followupOpen}
      onClose={props.onCloseFollowup ?? (() => {})}
      followupInstruction={props.followupInstruction}
      followupConstraints={props.followupConstraints}
      onFollowupInstructionChange={props.onFollowupInstructionChange}
      onFollowupConstraintsChange={props.onFollowupConstraintsChange}
      onSubmit={props.onSubmitFollowup}
      loading={loading}
    />
    <section className="grid gap-4">
      {/* Main content: Question, answer, discussion */}
      <div className="grid gap-4">
        <SessionPromptBlock
          result={result}
          team={team}
          loading={loading}
          onResendQuestion={props.onResendQuestion}
          teamTemplateName={props.teamTemplateName}
          isSavedAnswer={props.isSavedAnswer}
          onAskFollowup={props.onAskFollowup}
          onStartNewSession={props.onStartNewSession}
          onOpenInsights={props.onOpenInsights}
          onOpenAdvanced={props.onOpenAdvanced}
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
              teamTemplateName={props.teamTemplateName}
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
              isPublic={result.visibility === "public"}
              publicSlug={result.public_slug}
              shareBusy={shareBusy}
              onShareToggle={props.onShareToggle && (async () => {
                setShareBusy(true);
                try {
                  await props.onShareToggle!();
                } finally {
                  setShareBusy(false);
                }
              })}
              includeFullDebate={includeFullDebate}
              onIncludeFullDebateChange={setIncludeFullDebate}
            />
            <div className="flex min-w-0 flex-wrap items-center justify-start gap-x-3 gap-y-1 px-1 text-xs text-muted-foreground sm:justify-end">
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
          <div className="flex justify-start">
            <div className="w-full max-w-[880px]">
              <CollapsiblePanel
                title={loading ? "Live Follow-up Run" : "Live Debate Replay"}
                titleClassName="font-display text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300"
                defaultOpen={loading}
              >
                <div className="-mx-3.5 -mb-3.5 -mt-3">
                  <ChatroomDebateView
                    activity={activity}
                    cast={cast}
                    team={team}
                    loading={loading}
                    maxRounds={maxRounds}
                    consensusThreshold={consensusThreshold}
                    answerMode={answerMode}
                    prominent={loading}
                  />
                </div>
              </CollapsiblePanel>
            </div>
          </div>
        )}

        {/* 5. Director's Cut: full answer/critique text per round */}
        {showPreviousFullDebate && (
          <CollapsiblePanel
            title="Full Debate"
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
                // Use professional title from the active template; fall back gracefully
                const activeTemplate = props.teamTemplateName
                  ? TEAM_TEMPLATES.find((t) => t.name === props.teamTemplateName)
                  : null;
                const writerTemplMember = activeTemplate?.members.find((m) => m.name === writerName);
                const writerTitle = writerTemplMember ? writerTemplMember.role.split(" — ")[0].split(" - ")[0].trim() : "";
                const writerSublabel = writerTitle ? `Writer · ${writerTitle}` : "Writer";
                return (
                  <article
                    key={idx}
                    className={cn("grid gap-2", idx > 0 && "mt-3")}
                  >
                    <div className="flex items-center gap-3 select-none">
                      <div className="flex-1 border-t border-border/25" />
                      <div className="inline-flex items-baseline gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200/50 dark:border-violet-700/40">
                        <span className="text-[0.68rem] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 whitespace-nowrap">
                          Round {roundLabel}
                        </span>
                        <span className="text-[0.62rem] text-muted-foreground/55 whitespace-nowrap">
                          of {result.full_discussion.length}
                        </span>
                      </div>
                      <div className="flex-1 border-t border-border/25" />
                    </div>
                    <ol className="list-none m-0 grid gap-2 p-0">
                      <DebateChatBubble
                        id="writer"
                        label={writerName}
                        sublabel={writerSublabel}
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
                        const label = storedName || castMember?.name || modelLabel || "Critic";
                        const avatar = castMember?.avatar ?? DEBATE_SYSTEM_AVATAR;
                        const criticMemberName = castMember?.name ?? storedName ?? "";
                        const criticTemplMember = activeTemplate?.members.find((m) => m.name === criticMemberName);
                        const criticTitle = criticTemplMember ? criticTemplMember.role.split(" — ")[0].split(" - ")[0].trim() : "";
                        const criticSublabel = criticTitle || "Critic";
                        // Director's Cut: writer right, critics alternate left / right
                        const criticAlign: "left" | "right" = ci % 2 === 0 ? "left" : "right";
                        return (
                          <DebateChatBubble
                            key={ci}
                            id={`critic${ci + 1}`}
                            label={label}
                            sublabel={criticSublabel}
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
    </>
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

