import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, PanelLeftClose, PanelRight, Settings } from "lucide-react";
import { AnswersPanel, type AnswersPanelProps } from "../session/AnswersPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const RUNS_SIDEBAR_STORAGE_KEY = "multiai_runs_sidebar_open";

type Props = AnswersPanelProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string | null;
  onLogout?: () => void;
  runsThisMonth?: number | null;
  runsQuota?: number | null;
};

export const ConsensusRunsSidebar = forwardRef<HTMLElement, Props>(function ConsensusRunsSidebar(
  { open, onOpenChange, userEmail, onLogout, runsThisMonth, runsQuota, ...answersProps },
  ref
) {
  const navigate = useNavigate();
  const initial = userEmail ? userEmail[0].toUpperCase() : null;
  const quotaPct = runsQuota && runsThisMonth != null ? Math.min(100, (runsThisMonth / runsQuota) * 100) : null;
  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col bg-[var(--app-surface)] transition-all duration-200 ease-out",
        "md:flex-row md:border-r md:border-border md:sticky md:top-14 md:z-30 md:max-h-none md:h-[calc(100vh-3.5rem)] md:w-auto md:self-start"
      )}
    >
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-col overflow-hidden transition-[width,opacity] duration-200 ease-out",
          open
            ? "w-[min(290px,calc(100vw-3.5rem))] max-md:w-full opacity-100"
            : "w-0 opacity-0 pointer-events-none max-md:hidden"
        )}
      >
        <div className="flex h-full min-h-[120px] min-w-[290px] max-md:min-w-0 flex-col">
          <div className="shrink-0 border-b border-[#ffffff08] px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display m-0 text-sm font-bold leading-tight text-foreground">Team Answers</p>
                <p className="m-0 text-[10px] font-medium uppercase leading-snug tracking-[0.1em] text-muted-foreground">
                  Reruns of every verdict
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground md:inline-flex"
                aria-expanded={open}
                aria-label={open ? "Collapse team answers" : "Expand team answers"}
                onClick={() => onOpenChange(!open)}
              >
                {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto">
            <AnswersPanel ref={ref} compact {...answersProps} />
          </div>

          {/* User footer */}
          {(userEmail || onLogout) && (
            <div className="shrink-0 border-t border-[#ffffff08] px-3 py-2.5">
              <div className="flex items-center gap-2">
                {initial && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-[0.62rem] font-bold text-violet-500">
                    {initial}
                  </div>
                )}
                <span className="min-w-0 flex-1 truncate text-[0.65rem] text-muted-foreground">
                  {userEmail}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/settings")}
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Settings"
                  title="Settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
                {onLogout && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onLogout}
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Logout"
                    title="Logout"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {quotaPct !== null && runsThisMonth != null && runsQuota != null && (
                <div className="mt-2 grid gap-1">
                  <div className="flex justify-between text-[0.6rem] text-muted-foreground">
                    <span>Runs this month</span>
                    <span className={runsThisMonth >= runsQuota ? "text-amber-400" : ""}>{runsThisMonth} / {runsQuota}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className={`h-full rounded-full transition-all ${runsThisMonth >= runsQuota ? "bg-amber-400" : "bg-violet-600"}`}
                      style={{ width: `${quotaPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <nav
        className={cn(
          "flex shrink-0 flex-col items-center gap-3 border-[#ffffff08] bg-[var(--app-surface)]",
          "max-md:flex-row max-md:w-full max-md:justify-end max-md:border-b-0 max-md:border-t max-md:py-2",
          open
            ? "md:w-0 md:overflow-hidden md:opacity-0 md:pointer-events-none md:border-l-0 md:py-0"
            : "md:w-[52px] md:border-l md:py-3 md:opacity-100"
        )}
        aria-label="Runs sidebar controls"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-expanded={open}
          aria-label={open ? "Collapse team answers" : "Expand team answers"}
          onClick={() => onOpenChange(!open)}
        >
          {open ? <PanelLeftClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
        </Button>
        {/* Logout at bottom of collapsed strip */}
        {onLogout && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="mt-auto h-9 w-9 text-muted-foreground hover:text-foreground max-md:hidden"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </nav>
    </aside>
  );
});
