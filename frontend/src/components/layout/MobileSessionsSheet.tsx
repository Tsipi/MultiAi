import { Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { AnswersPanel, type AnswersPanelProps } from "@/components/session/AnswersPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = AnswersPanelProps & {
  onClose: () => void;
  loading?: boolean;
  error?: boolean;
  onRefresh?: () => void | Promise<void>;
};

export function MobileSessionsSheet({ onClose, loading, error, onRefresh, ...answerProps }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Scroll selected item into view after mount
  useEffect(() => {
    const el = scrollRef.current?.querySelector('[aria-current="true"]');
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const showSpinner = loading && answerProps.sessions.length === 0;
  const showList = !showSpinner && !error;

  return (
    <div className="fixed inset-0 z-[200] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-[var(--app-surface)] shadow-2xl pb-safe">
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
          <div>
            <p className="font-display m-0 text-sm font-bold leading-tight text-foreground">
              Team Answers
            </p>
            <p className="m-0 text-[10px] font-medium uppercase leading-snug tracking-[0.1em] text-muted-foreground">
              Reruns of every verdict
            </p>
          </div>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void onRefresh()}
                disabled={loading}
                className="min-h-[44px] min-w-[44px] shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Refresh sessions"
                title="Refresh"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] shrink-0"
              aria-label="Close sessions panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sessions list */}
        <div ref={scrollRef} className="sidebar-scroll min-h-0 flex-1 overflow-y-auto p-2">
          {showSpinner && (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-sm text-muted-foreground">Could not load sessions.</p>
              {onRefresh && (
                <Button type="button" variant="outline" size="sm" onClick={() => void onRefresh()}>
                  Try again
                </Button>
              )}
            </div>
          )}

          {showList && <AnswersPanel compact {...answerProps} />}
        </div>
      </div>
    </div>
  );
}
