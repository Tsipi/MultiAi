import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  followupInstruction: string;
  followupConstraints: string;
  onFollowupInstructionChange: (v: string) => void;
  onFollowupConstraintsChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

export function MobileFollowupSheet({
  isOpen,
  onClose,
  followupInstruction,
  followupConstraints,
  onFollowupInstructionChange,
  onFollowupConstraintsChange,
  onSubmit,
  loading,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Wait for the slide-up animation before focusing
      const t = window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 320);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[190] bg-black/40 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Follow-up composer"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[195] md:hidden",
          "rounded-t-2xl bg-[var(--app-surface)] shadow-2xl pb-safe",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-300">
            Ask follow-up
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="grid gap-3 px-4 pb-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Follow-up task or question
            </label>
            <textarea
              ref={textareaRef}
              value={followupInstruction}
              onChange={(e) => onFollowupInstructionChange(e.target.value)}
              onFocus={(e) =>
                setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }), 300)
              }
              placeholder="Describe what you want next..."
              disabled={loading}
              rows={4}
              className="command-input w-full resize-none rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Extra constraints{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={followupConstraints}
              onChange={(e) => onFollowupConstraintsChange(e.target.value)}
              placeholder="Add any additional constraints..."
              disabled={loading}
              rows={2}
              className="command-input w-full resize-none rounded-xl border border-violet-300/40 bg-card px-3 py-2 text-sm text-foreground disabled:opacity-50"
            />
          </div>
          <Button
            type="button"
            className="primary-cta font-display min-h-[44px] w-full rounded-xl border-0 font-semibold shadow-none"
            disabled={loading || !followupInstruction.trim()}
            onClick={() => {
              onSubmit();
              onClose();
            }}
          >
            Send follow-up
          </Button>
        </div>
      </div>
    </>
  );
}
