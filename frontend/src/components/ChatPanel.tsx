import { ConsultResult } from "../types";
import ReactMarkdown from "react-markdown";
import { ClarificationBox } from "./ClarificationBox";
import { downloadMarkdown, downloadPdf } from "../services/exporter";
import { MarkdownView } from "./MarkdownView";
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

type Props = {
  result: ConsultResult | null;
  showFullDiscussion: boolean;
  loading: boolean;
  activity: string[];
  cast: { writer: Person; criticA: Person; criticB: Person };
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
  const { result, showFullDiscussion, loading, activity, cast } = props;
  const showActivity = loading || activity.length > 0;
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
  const downloadTitle = result?.question?.trim() || "consensus_result";

  if (!result) {
    return (
      <section className="grid gap-4">
        {showActivity ? (
          <ActivityFeed
            title={loading ? "Live Team Banter" : "Fresh Team Banter"}
            activity={activity}
            cast={cast}
          />
        ) : (
          <p className="text-sm text-muted-foreground m-0">
            Drop a mission and your squad will brainstorm, roast weak ideas, then ship a cleaner answer.
          </p>
        )}
        {showClarify && clarifyBox}
      </section>
    );
  }

  const attachmentsForUi = attachmentListForDisplay(result);

  return (
    <section className="grid gap-4">
      {showActivity && (
        <ActivityFeed
          title={loading ? "Live Team Play-by-Play" : "Team Play-by-Play"}
          activity={activity}
          cast={cast}
        />
      )}
      {showClarify && clarifyBox}

      <SessionInsightsDashboard
        totalCostUsd={result.total_cost_usd}
        totalTokens={result.total_tokens}
        consensusScore={result.final_score}
        modelCosts={result.model_costs}
        sessionId={result.session_id}
      />

      <CollapsiblePanel title="Role & prompt" defaultOpen>
        <PromptContextTable
          role={result.role || ""}
          prompt={promptTextForDisplay(result) || ""}
          files={attachmentsForUi}
        />
      </CollapsiblePanel>

      <CollapsiblePanel title="Final answer from the crew" defaultOpen>
        <MarkdownView
          content={result.final_answer}
          className="border-0 bg-muted/15 px-0 py-1 max-w-none shadow-none"
        />
        <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-border/45">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() =>
              downloadMarkdown({
                title: downloadTitle,
                role: result.role,
                prompt: promptTextForExport(result),
                answer: result.final_answer
              })
            }
          >
            Download final answer (Markdown)
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() =>
              downloadPdf({
                title: downloadTitle,
                role: result.role,
                prompt: promptTextForExport(result),
                answer: result.final_answer
              })
            }
          >
            Download final answer (PDF)
          </Button>
        </div>
      </CollapsiblePanel>

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
              {result.source_final_answer || "Previous answer unavailable; follow-up used original prompt only."}
            </p>
            <p className="font-semibold m-0">Follow-up instruction</p>
            <p className="text-muted-foreground m-0">{result.followup_instruction || "Not provided."}</p>
          </div>
        </details>
      )}

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

      {showFullDiscussion && (
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
                    <ChatBubble id="john" label={cast.writer.name} avatar={cast.writer.avatar} tag={`Round ${roundLabel}`}>
                      <ReactMarkdown>{String(r.answer ?? "")}</ReactMarkdown>
                    </ChatBubble>
                    <ChatBubble id="christy" label={cast.criticA.name} avatar={cast.criticA.avatar} tag={`Round ${roundLabel}`}>
                      <ReactMarkdown>{christy}</ReactMarkdown>
                    </ChatBubble>
                    <ChatBubble id="mark" label={cast.criticB.name} avatar={cast.criticB.avatar} tag={`Round ${roundLabel}`}>
                      <ReactMarkdown>{mark}</ReactMarkdown>
                    </ChatBubble>
                    <ChatBubble id="system" label="Round Summary" avatar={SYSTEM_AVATAR} tag={`Round ${roundLabel}`}>
                      <ReactMarkdown>{String(r.summary ?? "")}</ReactMarkdown>
                    </ChatBubble>
                  </ol>
                </article>
              );
            })}
          </div>
        </CollapsiblePanel>
      )}
    </section>
  );
}

/* ===== Activity Feed ===== */
type Speaker = { id: "john" | "christy" | "mark" | "system"; label: string; avatar: string };
type Person = { name: string; avatar: string };

function ActivityFeed({
  title,
  activity,
  cast,
}: {
  title: string;
  activity: string[];
  cast: { writer: Person; criticA: Person; criticB: Person };
}) {
  return (
    <div className="rounded-xl p-3.5 bg-muted/20">
      <h2 className="text-[1.06rem] font-semibold tracking-tight m-0 mb-3">{title}</h2>
      <ol className="list-none m-0 p-0 max-h-[340px] overflow-auto grid gap-2">
        {activity.map((item, i) => {
          const speaker = detectSpeaker(item, cast);
          return (
            <ChatBubble key={i} id={speaker.id} label={speaker.label} avatar={speaker.avatar} tag={`Step ${i + 1}`}>
              <p className="m-0 text-[0.92rem] italic">{item}</p>
            </ChatBubble>
          );
        })}
      </ol>
    </div>
  );
}

/* ===== Reusable chat bubble ===== */
function ChatBubble({
  id,
  label,
  avatar,
  tag,
  children,
}: {
  id: "john" | "christy" | "mark" | "system";
  label: string;
  avatar: string;
  tag: string;
  children: React.ReactNode;
}) {
  return (
    <li className={cn("flex gap-2 items-end", id === "john" && "flex-row-reverse")}>
      <img
        className="w-8 h-8 rounded-full object-cover border border-border flex-shrink-0"
        src={avatar}
        alt={label}
      />
      <div
        className={cn(
          "max-w-[min(92%,900px)] rounded-xl border border-border/35 px-2.5 py-2 shadow-sm",
          `bubble-${id}`
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[0.75rem] font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
          <span className="text-[0.67rem] text-muted-foreground rounded-full px-1.5 py-0.5 bg-muted/50">
            {tag}
          </span>
        </div>
        <div className="disc-prose text-sm leading-snug">{children}</div>
      </div>
    </li>
  );
}

const SYSTEM_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' rx='32' fill='%23758cae'/%3E%3Ctext x='32' y='41' font-size='28' text-anchor='middle' fill='white' font-family='Arial'%3ES%3C/text%3E%3C/svg%3E";

function detectSpeaker(
  message: string,
  cast: { writer: Person; criticA: Person; criticB: Person }
): Speaker {
  const text = message.toLowerCase();
  if (text.includes("critic a") || text.includes("christy"))
    return { id: "christy", label: cast.criticA.name, avatar: cast.criticA.avatar };
  if (text.includes("critic b") || text.includes("mark"))
    return { id: "mark", label: cast.criticB.name, avatar: cast.criticB.avatar };
  if (text.includes("writer") || text.includes("john"))
    return { id: "john", label: cast.writer.name, avatar: cast.writer.avatar };
  return { id: "system", label: "System", avatar: SYSTEM_AVATAR };
}

function splitCritique(merged: string): { christy: string; mark: string } {
  const a = merged.match(/\[Critic A\]\s*([\s\S]*?)(?=\[Critic B\]|$)/i)?.[1]?.trim() ?? "";
  const b = merged.match(/\[Critic B\]\s*([\s\S]*)$/i)?.[1]?.trim() ?? "";
  if (!a && !b) return { christy: merged, mark: "No separate Mark critique captured in this round." };
  return {
    christy: a || "No separate Christy critique captured in this round.",
    mark: b || "No separate Mark critique captured in this round.",
  };
}
