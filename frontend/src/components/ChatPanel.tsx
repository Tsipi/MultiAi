import { ConsultResult } from "../types";
import ReactMarkdown from "react-markdown";
import { ClarificationBox } from "./ClarificationBox";
import { downloadMarkdown, downloadPdf } from "../services/exporter";
import { MarkdownView } from "./MarkdownView";
import { ModelCostDetails } from "./ModelCostDetails";
import { SessionMetricsBar } from "./SessionMetricsBar";
import { FollowupComposer } from "./FollowupComposer";

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
  const clarifyBox = <ClarificationBox reason={props.clarificationReason} question={props.clarificationPrompt} options={props.clarificationOptions} selected={props.clarificationChoice} otherText={props.clarificationOtherText} loading={loading} onSelect={props.onClarificationChoice} onOtherTextChange={props.onClarificationOtherText} onSubmit={props.onSubmitClarification} />;
  const downloadTitle = result?.question?.trim() || "consensus_result";
  if (!result) {
    return (
      <section className="panel chat">
        {showActivity ? (
          <ActivityFeed title={loading ? "Live Team Banter" : "Fresh Team Banter"} activity={activity} cast={cast} />
        ) : (
          <p className="muted">Drop a mission and your squad will brainstorm, roast weak ideas, then ship a cleaner answer.</p>
        )}
        {showClarify && clarifyBox}
      </section>
    );
  }
  return (
    <section className="panel chat">
      {showActivity && (
        <ActivityFeed title={loading ? "Live Team Play-by-Play" : "Team Play-by-Play"} activity={activity} cast={cast} />
      )}
      {showClarify && clarifyBox}
      <SessionMetricsBar totalCostUsd={result.total_cost_usd} totalTokens={result.total_tokens} consensusScore={result.final_score} />
      <div className="session-context">
        <p><b>Role:</b> {result.role || "Not provided"}</p>
        <p><b>Prompt:</b> {result.question || "Not provided"}</p>
      </div>
      <h2 className="section-title">Final Answer From The Crew</h2>
      <MarkdownView content={result.final_answer} />
      {result.is_followup && (
        <details>
          <summary>Context used</summary>
          <div className="followup-context">
            <p><b>Original prompt</b></p>
            <p className="muted clamp-3">{result.source_prompt || result.question}</p>
            <p><b>Previous final answer</b></p>
            <p className="muted clamp-3">{result.source_final_answer || "Previous answer unavailable; follow-up used original prompt only."}</p>
            <p><b>Follow-up instruction</b></p>
            <p className="muted">{result.followup_instruction || "Not provided."}</p>
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
        <p className="muted followup-retry-link">
          Follow-up run failed. <button className="ghost-btn" onClick={props.onRetryFollowup}>Retry follow-up</button>
        </p>
      )}
      <div className="download-row">
        <button onClick={() => downloadMarkdown({ title: downloadTitle, role: result.role, prompt: result.question, answer: result.final_answer })}>
          Download Markdown
        </button>
        <button onClick={() => downloadPdf({ title: downloadTitle, role: result.role, prompt: result.question, answer: result.final_answer })}>
          Download PDF
        </button>
      </div>
      <div className="meta">
        <span>{result.cost_hint}</span>
        <span>Session: {result.session_id}</span>
      </div>
      <ModelCostDetails rows={result.model_costs} />
      {showFullDiscussion && (
        <details>
          <summary>Director's Cut: Full Debate</summary>
          {result.full_discussion.map((r, idx) => {
            const roundLabel = String((r.round_num as number) ?? idx + 1);
            const { christy, mark } = splitCritique(String(r.critique ?? ""));
            return (
              <article key={idx} className="discussion-round">
                <strong>Round {roundLabel}</strong>
                <ol className="discussion-chat">
                  <li className="activity-chat-item john">
                    <img className="activity-avatar" src={cast.writer.avatar} alt={cast.writer.name} />
                    <div className="activity-bubble">
                      <div className="activity-head">
                        <span className="activity-name">{cast.writer.name}</span>
                        <span className="activity-tag">Round {roundLabel}</span>
                      </div>
                      <div className="discussion-body"><ReactMarkdown>{String(r.answer ?? "")}</ReactMarkdown></div>
                    </div>
                  </li>
                  <li className="activity-chat-item christy">
                    <img className="activity-avatar" src={cast.criticA.avatar} alt={cast.criticA.name} />
                    <div className="activity-bubble">
                      <div className="activity-head">
                        <span className="activity-name">{cast.criticA.name}</span>
                        <span className="activity-tag">Round {roundLabel}</span>
                      </div>
                      <div className="discussion-body"><ReactMarkdown>{christy}</ReactMarkdown></div>
                    </div>
                  </li>
                  <li className="activity-chat-item mark">
                    <img className="activity-avatar" src={cast.criticB.avatar} alt={cast.criticB.name} />
                    <div className="activity-bubble">
                      <div className="activity-head">
                        <span className="activity-name">{cast.criticB.name}</span>
                        <span className="activity-tag">Round {roundLabel}</span>
                      </div>
                      <div className="discussion-body"><ReactMarkdown>{mark}</ReactMarkdown></div>
                    </div>
                  </li>
                  <li className="activity-chat-item system">
                    <img className="activity-avatar" src={SYSTEM_AVATAR} alt="System" />
                    <div className="activity-bubble">
                      <div className="activity-head">
                        <span className="activity-name">Round Summary</span>
                        <span className="activity-tag">Round {roundLabel}</span>
                      </div>
                      <div className="discussion-body"><ReactMarkdown>{String(r.summary ?? "")}</ReactMarkdown></div>
                    </div>
                  </li>
                </ol>
              </article>
            );
          })}
        </details>
      )}
    </section>
  );
}

type Speaker = { id: "john" | "christy" | "mark" | "system"; label: string; avatar: string };
type Person = { name: string; avatar: string };

function ActivityFeed({ title, activity, cast }: { title: string; activity: string[]; cast: { writer: Person; criticA: Person; criticB: Person } }) {
  return (
    <div className="activity-box">
      <h2 className="section-title">{title}</h2>
      <ol className="activity-chat">
        {activity.map((item, i) => {
          const speaker = detectSpeaker(item, cast);
          return (
            <li key={i} className={`activity-chat-item ${speaker.id}`}>
              <img className="activity-avatar" src={speaker.avatar} alt={speaker.label} />
              <div className="activity-bubble">
                <div className="activity-head">
                  <span className="activity-name">{speaker.label}</span>
                  <span className="activity-tag">Step {i + 1}</span>
                </div>
                <p className="activity-text">{item}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
const SYSTEM_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' rx='32' fill='%23758cae'/%3E%3Ctext x='32' y='41' font-size='28' text-anchor='middle' fill='white' font-family='Arial'%3ES%3C/text%3E%3C/svg%3E";

function detectSpeaker(message: string, cast: { writer: Person; criticA: Person; criticB: Person }): Speaker {
  const text = message.toLowerCase();
  if (text.includes("critic a") || text.includes("christy")) return { id: "christy", label: cast.criticA.name, avatar: cast.criticA.avatar };
  if (text.includes("critic b") || text.includes("mark")) return { id: "mark", label: cast.criticB.name, avatar: cast.criticB.avatar };
  if (text.includes("writer") || text.includes("john")) return { id: "john", label: cast.writer.name, avatar: cast.writer.avatar };
  return { id: "system", label: "System", avatar: SYSTEM_AVATAR };
}

function splitCritique(merged: string): { christy: string; mark: string } {
  const a = merged.match(/\[Critic A\]\s*([\s\S]*?)(?=\[Critic B\]|$)/i)?.[1]?.trim() ?? "";
  const b = merged.match(/\[Critic B\]\s*([\s\S]*)$/i)?.[1]?.trim() ?? "";
  if (!a && !b) {
    return { christy: merged, mark: "No separate Mark critique captured in this round." };
  }
  return { christy: a || "No separate Christy critique captured in this round.", mark: b || "No separate Mark critique captured in this round." };
}
