import { AttachmentChipList } from "./AttachmentChipList";
import type { AttachmentInput } from "@/types";

type Props = {
  attachments: AttachmentInput[];
  onRemoveAttachment: (idx: number) => void;
};

/** Renders attached file chips below the input card. Button and keyboard hint live inside the card. */
export function CommandContextFooter({ attachments, onRemoveAttachment }: Props) {
  if (!attachments.length) return null;
  return (
    <div className="mt-2 px-1">
      <AttachmentChipList attachments={attachments} onRemove={onRemoveAttachment} />
    </div>
  );
}
