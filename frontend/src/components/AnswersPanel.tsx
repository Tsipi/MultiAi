import { forwardRef, useEffect, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { DebateActivityFeed } from "./DebateActivityFeed";
import { cn } from "@/lib/utils";
import { panelHeadingClass } from "@/lib/panelStyles";
import { ConsultResult, SessionPreview } from "../types";

type Person = { name: string; avatar: string };
type CastSelection = { writer: Person; criticA: Person; criticB: Person };
type ChatPanelProps = React.ComponentProps<typeof ChatPanel>;

type Props = {
  sessions: SessionPreview[];
  selectedId: string | null;
  sessionTitles: Record<string, string>;
  resultsById: Record<string, ConsultResult>;
  castBySession: Record<string, CastSelection>;
  chatPanelProps: ChatPanelProps;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export const AnswersPanel = forwardRef<HTMLElement, Props>(function AnswersPanel(
  {
    sessions,
    selectedId,
    sessionTitles,
    resultsById,
    castBySession,
    chatPanelProps,
    onSelect,
    onDelete,
  },
  ref
) {
  const [expandedId, setExpandedId] = useState<string | null>(selectedId);

  useEffect(() => {
    if (selectedId) setExpandedId(selectedId);
  }, [selectedId]);

  const threads = groupByThread(sessions);
  const clarifyPending = Boolean(
    chatPanelProps.clarificationPrompt &&
    chatPanelProps.clarificationOptions.length &&
    !chatPanelProps.loading
  );
  const orphanClarify = clarifyPending && !chatPanelProps.result;
  const hasContent =
    sessions.length > 0 || chatPanelProps.loading || Boolean(chatPanelProps.result) || orphanClarify;

  const toggleItem = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      onSelect(id);
    }
  };

  return (
    <aside ref={ref} className="glass-panel glass-panel-cheer glass-panel-hover flex flex-col gap-3 p-4">
      <button
        className="w-full flex items-center justify-between bg-transparent border-0 shadow-none cursor-default p-0 mb-0"
        aria-expanded={true}
      >
        <h2 className={cn("flex items-center gap-2.5", panelHeadingClass)}>
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-blue-300 flex-shrink-0 shadow-[0_0_0_3px_rgba(158,199,255,0.25)]" />
          Team Answers
        </h2>
      </button>

      {!hasContent && (
        <p className="text-sm text-muted-foreground m-0">
          Submit a question and your squad's answer will appear here.
        </p>
      )}

      {chatPanelProps.loading && (
        <DebateActivityFeed
          title="Your team is debating this now"
          subtitle="Watch each role weigh in as the Writer, Critics, and bench refine together."
          activity={chatPanelProps.activity}
          cast={chatPanelProps.cast}
          loading
          prominent
        />
      )}

      {orphanClarify && <ChatPanel {...chatPanelProps} />}

      {/* Accordion list of sessions */}
      <div className="flex flex-col gap-1.5 ">
        {threads.map((thread) => (
          <div key={thread.threadId} className="flex flex-col gap-1.5 glass-panel glass-panel-cheer">
            <AccordionItem
              session={thread.parent}
              title={
                sessionTitles[thread.parent.id] ||
                (thread.parent.run_title || thread.parent.question || "Untitled run").slice(0, 70)
              }
              isExpanded={expandedId === thread.parent.id}
              chatProps={buildSessionChatProps(
                thread.parent.id,
                selectedId,
                resultsById,
                castBySession,
                chatPanelProps
              )}
              suppressActivityFeed={chatPanelProps.loading}
              onToggle={() => toggleItem(thread.parent.id)}
              onDelete={onDelete}
            />
            {thread.runs.map((run) => (
              <AccordionItem
                key={run.id}
                session={run}
                title={
                  sessionTitles[run.id] ||
                  (run.run_title || run.question || "Untitled run").slice(0, 70)
                }
                isExpanded={expandedId === run.id}
                chatProps={buildSessionChatProps(
                  run.id,
                  selectedId,
                  resultsById,
                  castBySession,
                  chatPanelProps
                )}
                suppressActivityFeed={chatPanelProps.loading}
                onToggle={() => toggleItem(run.id)}
                onDelete={onDelete}
                child
              />
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
});

function buildSessionChatProps(
  sessionId: string,
  selectedId: string | null,
  resultsById: Record<string, ConsultResult>,
  castBySession: Record<string, CastSelection>,
  activeChatProps: ChatPanelProps
): ChatPanelProps {
  if (sessionId === selectedId) return activeChatProps;

  return {
    result: resultsById[sessionId] ?? null,
    showFullDiscussion: true,
    loading: false,
    activity: [],
    cast: castBySession[sessionId] ?? activeChatProps.cast,
    clarificationPrompt: "",
    clarificationReason: "",
    clarificationOptions: [],
    clarificationChoice: "",
    clarificationOtherText: "",
    onClarificationChoice: () => {},
    onClarificationOtherText: () => {},
    onSubmitClarification: () => {},
    followupOpen: false,
    followupInstruction: "",
    followupConstraints: "",
    followupChangedSinceOpen: false,
    onOpenFollowup: () => {},
    onFollowupInstructionChange: () => {},
    onFollowupConstraintsChange: () => {},
    onAdjustFollowupTeam: () => {},
    onSubmitFollowup: () => {},
    onRetryFollowup: () => {},
    onStartFresh: activeChatProps.onStartFresh,
    followupError: "",
  };
}

function AccordionItem({
  session,
  title,
  isExpanded,
  chatProps,
  suppressActivityFeed,
  onToggle,
  onDelete,
  child = false,
}: {
  session: SessionPreview;
  title: string;
  isExpanded: boolean;
  chatProps: ChatPanelProps;
  suppressActivityFeed: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
  child?: boolean;
}) {
  const description = [session.is_followup ? "Follow-up" : null, formatDate(session.timestamp)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={cn("rounded-xl bg-card/55 shadow-sm overflow-visible", child && "ml-3")}>
      <button
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-transparent hover:bg-muted/35 transition-colors cursor-pointer border-0 shadow-none text-left"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-150 flex-shrink-0",
            isExpanded ? "rotate-0" : "-rotate-90"
          )}
        />
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "block leading-snug line-clamp-1 text-sm",
              child ? "font-normal text-foreground/75" : "font-medium"
            )}
          >
            {title}
          </span>
          {description && (
            <span className="text-[0.72rem] text-muted-foreground leading-tight block">{description}</span>
          )}
        </div>
        <button
          className="flex items-center justify-center w-7 h-7 rounded-md bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors shadow-none p-0 cursor-pointer flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(session.id);
          }}
          aria-label="Delete session"
          title="Delete this run"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 bg-muted/15 rounded-b-xl">
          <ChatPanel {...chatProps} suppressActivityFeed={suppressActivityFeed} />
        </div>
      )}
    </div>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function groupByThread(
  sessions: SessionPreview[]
): Array<{ threadId: string; parent: SessionPreview; runs: SessionPreview[] }> {
  const byThread = new Map<string, SessionPreview[]>();
  for (const session of sessions) {
    const threadId = session.thread_id || session.id;
    const rows = byThread.get(threadId) ?? [];
    rows.push(session);
    byThread.set(threadId, rows);
  }
  const threads: Array<{ threadId: string; parent: SessionPreview; runs: SessionPreview[] }> = [];
  for (const [threadId, rows] of byThread.entries()) {
    const parent =
      rows.find((row) => !row.is_followup && row.id === threadId) ?? rows[rows.length - 1];
    const runs = rows.filter((row) => row.id !== parent.id);
    threads.push({ threadId, parent, runs });
  }
  return threads;
}
