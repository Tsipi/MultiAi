import { Copy, FileDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  exportBusy?: boolean;
  onCopy: () => void | Promise<void>;
  onDownloadMd: () => void | Promise<void>;
  onDownloadPdf: () => void | Promise<void>;
};

/** Export actions for the question bubble. */
export function SessionPromptDownloads({ exportBusy, onCopy, onDownloadMd, onDownloadPdf }: Props) {
  return (
    <div className="flex justify-start gap-2">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-8 w-8 rounded-full"
        aria-label="Copy final answer"
        title="Copy final answer"
        onClick={() => void onCopy()}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-8 w-8 rounded-full"
        disabled={exportBusy}
        aria-label="Download answer as markdown"
        title="Download answer as markdown"
        onClick={() => void onDownloadMd()}
      >
        <FileText className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-8 w-8 rounded-full"
        disabled={exportBusy}
        aria-label="Download answer as PDF"
        title="Download answer as PDF"
        onClick={() => void onDownloadPdf()}
      >
        <FileDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
