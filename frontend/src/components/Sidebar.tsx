import { SessionPreview } from "../types";

type Props = {
  sessions: SessionPreview[];
  selectedId: string | null;
  open: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export function Sidebar({ sessions, selectedId, open, onSelect, onDelete }: Props) {
  const threads = groupByThread(sessions);
  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <h1 className="title">Team Answers</h1>
      <p className="muted sidebar-sub">Previous runs</p>
      <div className="session-list">
        {threads.map((thread) => (
          <div key={thread.threadId} className="thread-group">
            <SessionRow
              session={thread.parent}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
            {thread.runs.map((run) => (
              <SessionRow
                key={run.id}
                session={run}
                selectedId={selectedId}
                onSelect={onSelect}
                onDelete={onDelete}
                child
              />
            ))}
          </div>
        ))}
        {sessions.length === 0 && <p className="muted">No sessions yet.</p>}
      </div>
    </aside>
  );
}

type RowProps = {
  session: SessionPreview;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  child?: boolean;
};

function SessionRow({ session, selectedId, onSelect, onDelete, child = false }: RowProps) {
  const title = (session.run_title || session.question || "Untitled run").slice(0, 60);
  const description = [
    session.is_followup ? "Follow-up" : null,
    formatDate(session.timestamp),
  ].filter(Boolean).join(" · ");

  return (
    <div className={`session-item${selectedId === session.id ? " active" : ""}${child ? " session-item-child" : ""}`}>
      <button className="session-open" onClick={() => onSelect(session.id)}>
        <span className="session-q">{title}</span>
        {description && <span className="session-meta">{description}</span>}
      </button>
      <button
        className="session-delete"
        onClick={() => onDelete(session.id)}
        aria-label="Delete session"
        title="Delete this run"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" fill="currentColor" />
        </svg>
      </button>
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

function groupByThread(sessions: SessionPreview[]): Array<{ threadId: string; parent: SessionPreview; runs: SessionPreview[] }> {
  const byThread = new Map<string, SessionPreview[]>();
  for (const session of sessions) {
    const threadId = session.thread_id || session.id;
    const rows = byThread.get(threadId) ?? [];
    rows.push(session);
    byThread.set(threadId, rows);
  }
  const threads: Array<{ threadId: string; parent: SessionPreview; runs: SessionPreview[] }> = [];
  for (const [threadId, rows] of byThread.entries()) {
    const parent = rows.find((row) => !row.is_followup && row.id === threadId) ?? rows[rows.length - 1];
    const runs = rows.filter((row) => row.id !== parent.id);
    threads.push({ threadId, parent, runs });
  }
  return threads;
}
