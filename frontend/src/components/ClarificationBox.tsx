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
    <div className="mb-3 border border-ring/40 rounded-lg p-3 grid gap-2">
      <h2 className="text-[1.06rem] font-semibold tracking-tight m-0">Clarification Needed</h2>
      <p className="text-sm text-muted-foreground m-0">{props.reason}</p>
      <p className="text-sm m-0">{props.question}</p>
      <div className="grid gap-1.5">
        {props.options.map((opt) => (
          <button
            key={opt}
            className={cn(
              "text-left w-full rounded-md border px-3 py-2 text-sm transition-colors cursor-pointer shadow-none",
              props.selected === opt
                ? "border-ring bg-ring/15 text-foreground font-medium"
                : "border-border bg-card/90 text-foreground hover:border-ring/40"
            )}
            onClick={() => props.onSelect(opt)}
          >
            {opt}
          </button>
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
      <Button onClick={props.onSubmit} disabled={props.loading || !canSubmit}>
        Continue with Clarification
      </Button>
    </div>
  );
}
