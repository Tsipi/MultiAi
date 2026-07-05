import { X } from "lucide-react";
import { useEffect } from "react";
import { AnswersPanel, type AnswersPanelProps } from "@/components/session/AnswersPanel";
import { Button } from "@/components/ui/button";

type Props = AnswersPanelProps & {
  onClose: () => void;
};

export function MobileSessionsSheet({ onClose, ...answerProps }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-[var(--app-surface)] shadow-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 shrink-0"
            aria-label="Close sessions panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sessions list */}
        <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto p-2">
          <AnswersPanel compact {...answerProps} />
        </div>
      </div>
    </div>
  );
}
