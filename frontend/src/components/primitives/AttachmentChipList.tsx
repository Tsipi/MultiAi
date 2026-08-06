import { X } from "lucide-react";
import { AttachmentInput } from "../../types";

type Props = { attachments: AttachmentInput[]; onRemove: (idx: number) => void };

export function AttachmentChipList({ attachments, onRemove }: Props) {
  if (!attachments.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((a, idx) => (
        <span
          key={`${a.name}-${idx}`}
          className="inline-flex max-w-full items-center gap-1.5 rounded border border-border bg-card/80 px-2.5 py-1 text-xs text-foreground"
        >
          <span className="shrink-0 font-semibold uppercase text-muted-foreground">{a.kind}</span>
          <span className="min-w-0 truncate">{a.name}</span>
          <button
            type="button"
            aria-label={`Remove ${a.name}`}
            title={`Remove ${a.name}`}
            onClick={() => onRemove(idx)}
            className="ml-0.5 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
