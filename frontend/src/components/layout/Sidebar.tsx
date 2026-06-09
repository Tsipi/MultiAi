import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionPreview } from "../../types";

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
    <aside
      className={cn(
        "glass-panel-hover flex flex-col gap-3 p-4",
        "bg-sidebar backdrop-blur-xl border-border/60",
        // Mobile/tablet: fixed drawer from left, sits below the 56px header
        "fixed top-14 left-0 bottom-0 z-[200] w-72 border-r rounded-none transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full",
        // Desktop: static in grid, slightly darker sidebar background
        "lg:static lg:translate-x-0 lg:rounded-[14px] lg:border lg:h-auto lg:w-auto"
      )}
    >
      <h1 className="text-lg font-bold tracking-tight m-0">Team Answers</h1>
      <p className="text-xs text-muted-foreground m-0">Previous runs</p>
      <div className="flex flex-col gap-1.5 sidebar-scroll flex-1">
        {threads.map((thread) => (
          <div key={thread.threadId} className="flex flex-col gap-1.5">
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
        {sessions.length === 0 && (
          <p className="text-sm text-muted-foreground">No sessions yet.</p>
        )}
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
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto] items-center gap-1 rounded-md border border-border/80 bg-card/90 px-1.5 py-1 transition-colors",
        "hover:border-ring/30",
        selectedId === session.id && "border-ring bg-ring/10",
        child && "ml-3 text-[0.74rem] text-foreground/75"
      )}
    >
      <button
        className="text-left bg-transparent border-0 shadow-none p-1 flex flex-col gap-0.5 min-h-0 cursor-pointer"
        onClick={() => onSelect(session.id)}
      >
        <span className={cn("font-semibold leading-snug line-clamp-1", child && "font-normal")}>
          {title}
        </span>
        {description && (
          <span className="text-[0.72rem] text-muted-foreground leading-tight">{description}</span>
        )}
      </button>
      <button
        className="flex items-center justify-center w-6 h-6 rounded border border-transparent bg-transparent text-muted-foreground hover:border-border hover:text-foreground transition-colors shadow-none p-0 cursor-pointer"
        onClick={() => onDelete(session.id)}
        aria-label="Delete session"
        title="Delete this run"
      >
        <Trash2 className="w-3 h-3" />
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
