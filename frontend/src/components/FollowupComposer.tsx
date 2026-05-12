import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CollapsiblePanel } from "./CollapsiblePanel";

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

/**
 * One panel: collapsed teaser or full follow-up form. Width matches other result panels (full).
 */
export function FollowupComposer(props: Props) {
  const canSubmit = Boolean(props.instruction.trim()) && !props.loading;

  return (
    <CollapsiblePanel
      key={props.open ? "followup-editing" : "followup-idle"}
      title="Follow-up on this answer"
      defaultOpen={props.open}
      className="w-full"
    >
      {!props.open ? (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground m-0 mb-1">
              Continue this conversation in the same thread.
            </p>
            <p className="text-sm text-muted-foreground m-0 leading-relaxed">
              The next run uses your original prompt and the final answer above as context—same as opening a
              follow-up from the composer.
            </p>
          </div>
          <Button type="button" className="shrink-0 w-full sm:w-auto min-w-[148px]" onClick={props.onOpen}>
            Write follow-up
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground m-0">
            Describe what you want next. We send this together with the original prompt and the latest final
            answer.
          </p>

          <Label>
            Follow-up task or question
            <Textarea
              name="followup_instruction"
              value={props.instruction}
              rows={4}
              onChange={(e) => props.onInstructionChange(e.target.value)}
            />
          </Label>
          <Label>
            Extra constraints (optional)
            <Textarea
              name="followup_constraints"
              value={props.constraints}
              rows={3}
              onChange={(e) => props.onConstraintsChange(e.target.value)}
            />
          </Label>

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

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Button type="button" onClick={props.onSubmit} disabled={!canSubmit}>
              {props.loading
                ? "Sending..."
                : props.changedSinceOpen
                  ? "Send follow-up (with team changes)"
                  : "Send follow-up"}
            </Button>
            <Button type="button" variant="outline" onClick={props.onAdjustTeam}>
              Adjust team for this follow-up
            </Button>
            <Button type="button" variant="ghost" onClick={props.onStartFresh}>
              Start fresh
            </Button>
          </div>
        </div>
      )}
    </CollapsiblePanel>
  );
}
