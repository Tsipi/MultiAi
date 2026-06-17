import { forwardRef, useEffect, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { ChatPanel } from "../debate/ChatPanel";
import { ChatroomDebateView } from "../debate/ChatroomDebateView";
import { cn } from "@/lib/utils";
import { panelHeadingClass } from "@/lib/panelStyles";
import { AnswerMode, ConsultResult, SessionPreview } from "../../types";
import { type CastSelection } from "@/lib/consultHelpers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ChatPanelProps = React.ComponentProps<typeof ChatPanel>;

const rowButtonFocusClass =
  "outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0";

function answerModeForResult(result: ConsultResult | null | undefined, fallback: AnswerMode): AnswerMode {
  return result?.answer_mode ?? fallback;
}

export type AnswersPanelProps = {
  sessions: SessionPreview[];
  selectedId: string | null;
  sessionTitles: Record<string, string>;
  resultsById: Record<string, ConsultResult>;
  castBySession: Record<string, CastSelection>;
  chatPanelProps: ChatPanelProps;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  /** Sidebar layout: tighter chrome, no duplicate "Consensus" title */
  compact?: boolean;
};

type Props = AnswersPanelProps;

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
    compact = false,
  },
  ref
) {
  const [expandedId, setExpandedId] = useState<string | null>(selectedId);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (compact) return;
    if (selectedId) setExpandedId(selectedId);
  }, [selectedId, compact]);

  const sessionNumberMap = Object.fromEntries(
    sessions.map((s, i) => [s.id, sessions.length - i])
  );
  const threads = groupByThread(sessions);
  const query = searchText.trim().toLowerCase();
  const filteredThreads = !query
    ? threads
    : threads
        .map((thread) => {
          const parentTitle =
            sessionTitles[thread.parent.id] ||
            (thread.parent.run_title || thread.parent.question || "Untitled run").slice(0, 70);
          const parentHit = parentTitle.toLowerCase().includes(query);
          const runs = thread.runs.filter((run) => {
            const runTitle =
              sessionTitles[run.id] || (run.run_title || run.question || "Untitled run").slice(0, 70);
            return runTitle.toLowerCase().includes(query);
          });
          if (parentHit || runs.length) return { ...thread, runs };
          return null;
        })
        .filter(Boolean) as typeof threads;
  const clarifyPending = Boolean(
    chatPanelProps.clarificationPrompt &&
    chatPanelProps.clarificationOptions.length &&
    !chatPanelProps.loading
  );
  const orphanClarify = !compact && clarifyPending && !chatPanelProps.result;
  const hasContent =
    sessions.length > 0 ||
    chatPanelProps.loading ||
    Boolean(chatPanelProps.result) ||
    orphanClarify;

  const toggleItem = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      onSelect(id);
    }
  };

  const selectRow = (id: string) => {
    onSelect(id);
  };

  return (
    <aside
      ref={ref}
      className={cn(
        "flex flex-col gap-3",
        compact
          ? "bg-transparent border-0 shadow-none p-1 sm:p-2"
          : "v2-consensus-shell p-4 border border-violet-500/15"
      )}
    >
      {!compact && (
        <div className="w-full flex items-center justify-between bg-transparent border-0 shadow-none p-0 mb-0">
          <h2 className={cn("flex items-center gap-2.5 font-display", panelHeadingClass)}>
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex-shrink-0 opacity-95" />
            Consensus
          </h2>
        </div>
      )}

      {!hasContent && (
        <p className="text-sm text-muted-foreground m-0">
          {compact ? "No runs yet. Send your team a question." : "Submit a question and your squad's answer will appear here."}
        </p>
      )}

      {compact && sessions.length > 0 && (
        <div className="grid gap-1.5 rounded-xl border border-[#ffffff0a] bg-[var(--v2-elevated)]/55 p-2">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search team answers..."
            className="h-8 bg-[var(--v2-surface)]"
          />
          <div className="flex items-center justify-between">
            <p className="m-0 text-[11px] text-muted-foreground">
              {query ? `${filteredThreads.length} result(s)` : `${threads.length} answer group(s)`}
            </p>
            {query && (
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSearchText("")}>
                Show all
              </Button>
            )}
          </div>
        </div>
      )}

      {compact && hasContent && sessions.length === 0 && (
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.08] p-2.5">
          <p className="m-0 text-xs font-semibold text-violet-300">Current run</p>
          <p className="m-0 mt-1 text-xs text-muted-foreground">
            Debate is active in the main panel. Saved runs will appear here after completion.
          </p>
        </div>
      )}

      {!compact && chatPanelProps.loading && (
        <ChatroomDebateView
          activity={chatPanelProps.activity}
          cast={chatPanelProps.cast}
          team={chatPanelProps.team}
          loading
          maxRounds={chatPanelProps.maxRounds}
          consensusThreshold={chatPanelProps.consensusThreshold}
          answerMode={chatPanelProps.answerMode}
          prominent
        />
      )}

      {orphanClarify && <ChatPanel {...chatPanelProps} />}

      {/* Accordion list of sessions */}
      <div className="flex flex-col gap-1.5 ">
        {filteredThreads.map((thread) => (
          <div
            key={thread.threadId}
            className="flex flex-col gap-1.5 rounded-xl border border-[#ffffff08] bg-[var(--v2-surface)] p-1"
          >
            <AccordionItem
              session={thread.parent}
              title={
                sessionTitles[thread.parent.id] ||
                (thread.parent.run_title || thread.parent.question || "Untitled run").slice(0, 70)
              }
              sessionNumber={sessionNumberMap[thread.parent.id] ?? 0}
              isExpanded={!compact && expandedId === thread.parent.id}
              isSelected={compact && selectedId === thread.parent.id}
              listSelectOnly={compact}
              chatProps={buildSessionChatProps(
                thread.parent.id,
                selectedId,
                resultsById,
                castBySession,
                chatPanelProps
              )}
              suppressActivityFeed={chatPanelProps.loading}
              onToggle={() => (compact ? selectRow(thread.parent.id) : toggleItem(thread.parent.id))}
              onDelete={onDelete}
            />
            {thread.runs.map((run) => (
              <AccordionItem
                key={run.id}
                session={run}
                title={
                  sessionTitles[run.id] || (run.run_title || run.question || "Untitled run").slice(0, 70)
                }
                sessionNumber={sessionNumberMap[run.id] ?? 0}
                isExpanded={!compact && expandedId === run.id}
                isSelected={compact && selectedId === run.id}
                listSelectOnly={compact}
                chatProps={buildSessionChatProps(
                  run.id,
                  selectedId,
                  resultsById,
                  castBySession,
                  chatPanelProps
                )}
                suppressActivityFeed={chatPanelProps.loading}
                onToggle={() => (compact ? selectRow(run.id) : toggleItem(run.id))}
                onDelete={onDelete}
                child
              />
            ))}
          </div>
        ))}
        {compact && query && filteredThreads.length === 0 && (
          <p className="m-0 rounded-lg border border-[#ffffff08] bg-[var(--v2-elevated)]/45 px-3 py-2 text-xs text-muted-foreground">
            No answers match your search. Use Show all to reset.
          </p>
        )}
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
    onResendQuestion: () => {},
    followupError: "",
    isSavedAnswer: true,
    onAskFollowup: () => {},
    onStartNewSession: activeChatProps.onStartNewSession,
    team: activeChatProps.team,
    maxRounds: activeChatProps.maxRounds,
    consensusThreshold: activeChatProps.consensusThreshold,
    answerMode: answerModeForResult(resultsById[sessionId], activeChatProps.answerMode),
  };
}

function AccordionItem({
  session,
  title,
  sessionNumber = 0,
  isExpanded,
  isSelected,
  listSelectOnly,
  chatProps,
  suppressActivityFeed,
  onToggle,
  onDelete,
  child = false,
}: {
  session: SessionPreview;
  title: string;
  sessionNumber?: number;
  isExpanded: boolean;
  isSelected: boolean;
  listSelectOnly: boolean;
  chatProps: ChatPanelProps;
  suppressActivityFeed: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
  child?: boolean;
}) {
  const description = [session.is_followup ? "Follow-up" : null, formatDate(session.timestamp)]
    .filter(Boolean)
    .join(" · ");

  if (listSelectOnly) {
    return (
      <div
        className={cn(
          "sidebar-answer-card rounded-xl border overflow-hidden transition-all duration-150 ease-out",
          isSelected && "sidebar-answer-card-selected",
          child && "ml-2 sm:ml-3"
        )}
      >
        <div className="flex items-stretch gap-1">
          <button
            type="button"
            className={cn(
              "min-w-0 flex-1 flex items-center gap-2 px-3 py-2.5 bg-transparent text-left transition-colors cursor-pointer border-0 shadow-none rounded-xl",
              rowButtonFocusClass
            )}
            onClick={onToggle}
            aria-current={isSelected ? "true" : undefined}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <span
                  className={cn(
                    "leading-snug line-clamp-2 text-sm",
                    child ? "font-normal text-foreground/85" : "font-medium"
                  )}
                >
                  {title}
                </span>
                {sessionNumber > 0 && (
                  <span className="text-[0.62rem] text-muted-foreground/55 shrink-0 mt-0.5">#{sessionNumber}</span>
                )}
              </div>
              {description && (
                <span className="text-[0.72rem] text-muted-foreground leading-tight block">{description}</span>
              )}
            </div>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-auto w-9 shrink-0 rounded-l-none rounded-r-xl bg-transparent text-muted-foreground hover:bg-muted/45 hover:text-foreground"
            onClick={() => onDelete(session.id)}
            aria-label="Delete session"
            title="Delete this run"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-[#ffffff06] bg-[var(--v2-elevated)]/55 overflow-visible", child && "ml-3")}>
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 flex items-center gap-2 px-3 py-2.5 bg-transparent hover:bg-muted/35 transition-colors cursor-pointer border-0 shadow-none text-left rounded-xl",
            rowButtonFocusClass
          )}
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
              <div className="flex items-center justify-between">
                <span className="text-[0.72rem] text-muted-foreground leading-tight">{description}</span>
                {sessionNumber > 0 && (
                  <span className="text-[0.62rem] text-muted-foreground/55 shrink-0 ml-1">#{sessionNumber}</span>
                )}
              </div>
            )}
          </div>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-auto w-9 shrink-0 rounded-l-none rounded-r-xl bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(session.id);
          }}
          aria-label="Delete session"
          title="Delete this run"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

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
