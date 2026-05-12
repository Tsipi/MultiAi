import { forwardRef } from "react";
import { PanelLeftClose, PanelRight } from "lucide-react";
import { AnswersPanel, type AnswersPanelProps } from "./AnswersPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const RUNS_SIDEBAR_STORAGE_KEY = "multiai_runs_sidebar_open";

type Props = AnswersPanelProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ConsensusRunsSidebar = forwardRef<HTMLElement, Props>(function ConsensusRunsSidebar(
  { open, onOpenChange, ...answersProps },
  ref
) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col bg-[var(--v2-surface)] transition-all duration-200 ease-out",
        "max-md:max-h-[min(46vh,380px)] max-md:w-full max-md:self-stretch max-md:border-b max-md:border-[#ffffff10]",
        "md:flex-row md:border-r md:border-[#ffffff10] md:sticky md:top-14 md:z-30 md:max-h-none md:h-[calc(100vh-3.5rem)] md:w-auto md:self-start"
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
        </div>
      </div>

      <nav
        className={cn(
          "flex shrink-0 flex-col items-center gap-3 border-[#ffffff08] bg-[var(--v2-surface)]",
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
      </nav>
    </aside>
  );
});
