import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  reason: string;
  question: string;
  options: string[];
  selected: string;
  otherText: string;
  loading: boolean;
  onSelect: (value: string) => void;
  onOtherTextChange: (value: string) => void;
  onSubmit: () => void;
};

export function ClarificationBox(props: Props) {
  const usingOther = props.selected === "Other";
  const canSubmit = props.selected && (!usingOther || props.otherText.trim());

  return (
    <div className="rounded-xl border border-violet-500/20 bg-[var(--app-surface)] p-4 grid gap-3 shadow-sm">
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300 m-0">
          Clarification Needed
        </p>
        <p className="mt-2 text-sm font-medium text-foreground m-0">{props.question}</p>
      </div>

      <div className="grid gap-1.5">
        {props.options.map((opt) => (
          <Button
            key={opt}
            type="button"
            variant="outline"
            className={cn(
              "h-auto w-full justify-start whitespace-normal rounded-lg px-3 py-2.5 text-left text-sm font-normal",
              props.selected === opt
                ? "border-violet-500/60 bg-violet-500/10 text-foreground font-medium"
                : "border-border/60 bg-card/80 text-foreground hover:border-violet-400/40 hover:bg-violet-500/5"
            )}
            onClick={() => props.onSelect(opt)}
          >
            {opt}
          </Button>
        ))}
      </div>

      {usingOther && (
        <Label>
          Other (please specify)
          <Input
            value={props.otherText}
            onChange={(e) => props.onOtherTextChange(e.target.value)}
            placeholder="Type your clarification"
          />
        </Label>
      )}

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          className="font-display h-10 rounded-xl px-6 font-semibold"
          onClick={props.onSubmit}
          disabled={props.loading || !canSubmit}
        >
          {props.loading ? "Starting debate…" : "Continue"}
        </Button>
        {props.loading && (
          <p className="text-sm text-muted-foreground m-0 animate-pulse">
            Your team is assembling the debate…
          </p>
        )}
      </div>
    </div>
  );
}
