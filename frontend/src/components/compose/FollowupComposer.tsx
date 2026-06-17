import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CollapsiblePanel } from "../primitives/CollapsiblePanel";

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

function SourceAnchor({ prompt }: { prompt: string }) {
  if (!prompt) return null;
  return (
    <p className="m-0 flex min-w-0 items-baseline gap-1 text-xs text-muted-foreground">
      <span className="shrink-0">Building on:</span>
      <span className="min-w-0 truncate font-medium italic text-foreground/70">
        "{prompt}"
      </span>
    </p>
  );
}

export function FollowupComposer(props: Props) {
  const canSubmit = Boolean(props.instruction.trim()) && !props.loading;

  return (
    <CollapsiblePanel
      key={props.open ? "followup-editing" : "followup-idle"}
      title="Follow-up on this answer"
      titleClassName="font-display text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300"
      defaultOpen={props.open}
      className="w-full"
    >
      {!props.open ? (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground m-0 mb-1">
              Continue this conversation in the same thread.
            </p>
            <p className="text-sm text-muted-foreground m-0 leading-relaxed">
              The next run uses your original prompt and the final answer above as context.
            </p>
            <div className="mt-1.5">
              <SourceAnchor prompt={props.sourcePrompt} />
            </div>
          </div>
          <Button
            type="button"
            className="primary-cta font-display h-10 shrink-0 w-full sm:w-auto min-w-[148px] rounded-xl border-0 font-semibold shadow-none"
            onClick={props.onOpen}
          >
            Write follow-up
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="grid gap-1">
            <p className="text-sm text-muted-foreground m-0">
              Describe what you want next. We send this together with the original prompt and the latest
              final answer.
            </p>
            <SourceAnchor prompt={props.sourcePrompt} />
          </div>

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

          <div className="flex flex-col gap-3 pt-1">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                type="button"
                className="primary-cta font-display h-10 rounded-xl border-0 px-6 font-semibold shadow-none"
                onClick={props.onSubmit}
                disabled={!canSubmit}
              >
                {props.loading
                  ? "Sending…"
                  : props.changedSinceOpen
                    ? "Send follow-up (with team changes)"
                    : "Send follow-up"}
              </Button>
              <Button type="button" variant="outline" onClick={props.onAdjustTeam} disabled={props.loading}>
                Adjust team
              </Button>
              <Button type="button" variant="ghost" onClick={props.onStartFresh} disabled={props.loading}>
                Start fresh
              </Button>
            </div>

            {props.loading && (
              <p className="text-sm text-muted-foreground m-0 animate-pulse">
                Your team is working on the follow-up…
              </p>
            )}
          </div>
        </div>
      )}
    </CollapsiblePanel>
  );
}
