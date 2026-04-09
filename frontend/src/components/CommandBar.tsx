import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  /** First name or nickname for the greeting line (falls back to "there"). */
  userDisplayName: string;
  disabled?: boolean;
  loading?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function CommandBar({ value, userDisplayName, disabled, loading, onChange, onSubmit }: Props) {
  const busy = Boolean(disabled || loading);
  const who = userDisplayName.trim() || "there";

  return (
    <section className="w-full">
      <p className="font-display text-base font-semibold leading-snug text-foreground mb-2.5 m-0 max-w-3xl">
        Hi {who} — how can the team help you today?
      </p>
      <div
        className={cn(
          "rounded-2xl border border-[#ffffff10] bg-[var(--v2-surface)] transition-[box-shadow,border-color] duration-200",
          "p-1.5 sm:p-2"
        )}
      >
        <textarea
          className={cn(
            "v2-command-input w-full resize-y min-h-[120px] sm:min-h-[100px] rounded-xl border border-transparent bg-[var(--v2-elevated)] px-4 py-3.5",
            "text-[17px] sm:text-lg font-semibold font-display text-foreground placeholder:text-muted-foreground/55"
          )}
          placeholder="Ask your team…"
          rows={4}
          value={value}
          disabled={busy}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey) return;
            e.preventDefault();
            if (!value.trim() || busy) return;
            onSubmit();
          }}
        />
        <div className="flex flex-wrap items-center justify-end gap-2 mt-2 px-1 pb-1">
          <span className="text-[11px] text-muted-foreground mr-auto hidden sm:inline">
            Enter to run · Shift+Enter new line
          </span>
          <Button
            type="button"
            size="lg"
            disabled={busy || !value.trim()}
            className="v2-primary-cta font-display font-semibold tracking-tight rounded-xl h-11 px-6 border-0 shadow-none"
            onClick={() => onSubmit()}
          >
            {loading ? "Team is running…" : "Send to team"}
          </Button>
        </div>
      </div>
    </section>
  );
}
