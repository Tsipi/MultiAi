import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  instruction: string;
  constraints: string;
  loading: boolean;
  changedSinceOpen: boolean;
  sourcePrompt: string;
  sourceAnswer: string;
  onOpen: () => void;
  onInstructionChange: (value: string) => void;
  onConstraintsChange: (value: string) => void;
  onAdjustTeam: () => void;
  onSubmit: () => void;
  onStartFresh: () => void;
};

export function FollowupComposer(props: Props) {
  if (!props.open) {
    return (
      <section className="my-4 mx-auto max-w-[78ch] border border-ring/35 border-t-[3px] border-t-ring/65 rounded-lg p-4 bg-gradient-to-br from-card/95 to-card/90 flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-ring/35 bg-ring/12 px-2.5 py-1 text-[0.72rem] font-bold uppercase tracking-widest text-foreground/80 mb-1.5">
            <span className="w-2 h-2 rounded-full animate-green-pulse flex-shrink-0" />
            Continue Thread
          </div>
          <h3 className="text-[1.06rem] font-semibold tracking-tight m-0 mb-1">
            Want to continue this thread?
          </h3>
          <p className="text-sm text-muted-foreground m-0">
            Ask a follow-up using the original prompt and the latest final answer.
          </p>
        </div>
        <Button
          className="min-w-[160px] shrink-0"
          onClick={props.onOpen}
        >
          Ask Follow-up
        </Button>
      </section>
    );
  }

  const canSubmit = Boolean(props.instruction.trim()) && !props.loading;

  return (
    <section className="my-4 mx-auto max-w-[78ch] border border-border rounded-lg p-4 bg-card/90 grid gap-3">
      <h3 className="text-[1.06rem] font-semibold tracking-tight m-0">
        Continue with a follow-up
      </h3>
      <p className="text-sm text-muted-foreground m-0">
        We will reuse your original prompt and latest final answer as context.
      </p>

      <Label>
        Follow-up task or question
        <Textarea
          value={props.instruction}
          rows={4}
          onChange={(e) => props.onInstructionChange(e.target.value)}
        />
      </Label>
      <Label>
        Extra constraints (optional)
        <Textarea
          value={props.constraints}
          rows={3}
          onChange={(e) => props.onConstraintsChange(e.target.value)}
        />
      </Label>

      <div className="flex items-center gap-2 rounded-full border border-border bg-card/85 px-3 py-1.5 text-sm overflow-hidden">
        Using original prompt + latest final answer
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
          Context used
        </summary>
        <div className="mt-2 grid gap-2">
          <p className="font-semibold m-0">Original prompt</p>
          <p className="text-muted-foreground line-clamp-3 m-0">{props.sourcePrompt || "Not available"}</p>
          <p className="font-semibold m-0">Previous final answer</p>
          <p className="text-muted-foreground line-clamp-3 m-0">{props.sourceAnswer || "Not available"}</p>
          <p className="font-semibold m-0">Follow-up instruction</p>
          <p className="text-muted-foreground m-0">{props.instruction || "Not provided yet"}</p>
        </div>
      </details>

      {props.changedSinceOpen && (
        <p className="text-sm text-foreground/75 border-l-2 border-ring/50 pl-2 m-0">
          Team/settings updated. This follow-up will use the latest configuration.
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={props.onSubmit} disabled={!canSubmit}>
          {props.loading
            ? "Asking follow-up..."
            : props.changedSinceOpen
            ? "Ask Follow-up with Changes"
            : "Ask Follow-up"}
        </Button>
        <Button type="button" variant="outline" onClick={props.onAdjustTeam}>
          Adjust team for this follow-up
        </Button>
        <Button type="button" variant="ghost" onClick={props.onStartFresh}>
          Start fresh
        </Button>
      </div>
    </section>
  );
}
