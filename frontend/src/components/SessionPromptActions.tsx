import { Copy, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  copyText: string;
  onCopy: () => void | Promise<void>;
  onEdit: () => void;
};

/** Copy/edit controls under the right-aligned question bubble. */
export function SessionPromptActions({ copyText, onCopy, onEdit }: Props) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => void onCopy()} title={copyText}>
        <Copy className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={onEdit}>
        <PencilLine className="h-4 w-4" />
      </Button>
    </div>
  );
}
