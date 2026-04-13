import { Button } from "@/components/ui/button";
import { AttachmentChipList } from "./AttachmentChipList";
import type { AttachmentInput } from "@/types";

type Props = {
  busy: boolean;
  loading: boolean;
  valueEmpty: boolean;
  attachments: AttachmentInput[];
  onSubmit: () => void;
  onRemoveAttachment: (idx: number) => void;
};

export function CommandContextFooter({
  busy,
  loading,
  valueEmpty,
  attachments,
  onSubmit,
  onRemoveAttachment,
}: Props) {
  return (
    <>
      <div className="mt-3 flex flex-col gap-2 px-1">
        <p className="m-0 text-[11px] text-muted-foreground">Enter to run · Shift+Enter new line</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            size="lg"
            disabled={busy || valueEmpty}
            className="v2-primary-cta font-display h-11 rounded-xl border-0 px-6 font-semibold shadow-none"
            onClick={() => onSubmit()}
          >
            {loading ? "Team is running…" : "Send to team"}
          </Button>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="mt-3 px-1">
          <AttachmentChipList attachments={attachments} onRemove={onRemoveAttachment} />
        </div>
      )}
    </>
  );
}
