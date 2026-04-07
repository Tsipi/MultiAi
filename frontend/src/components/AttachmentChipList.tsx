import { AttachmentInput } from "../types";

type Props = { attachments: AttachmentInput[]; onRemove: (idx: number) => void };

export function AttachmentChipList({ attachments, onRemove }: Props) {
  if (!attachments.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((a, idx) => (
        <button
          key={`${a.name}-${idx}`}
          type="button"
          className="inline-flex cursor-pointer items-center gap-1 rounded border border-border bg-card/80 px-2.5 py-1 text-xs text-foreground shadow-none transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(idx)}
        >
          {a.kind.toUpperCase()}: {a.name} ✕
        </button>
      ))}
    </div>
  );
}
