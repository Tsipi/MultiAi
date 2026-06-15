import { Copy, FileDown, FileText, Globe, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  exportBusy?: boolean;
  onCopy: () => void | Promise<void>;
  onDownloadMd: () => void | Promise<void>;
  onDownloadPdf: () => void | Promise<void>;
  isPublic?: boolean;
  shareBusy?: boolean;
  onShareToggle?: () => void | Promise<void>;
  includeFullDebate?: boolean;
  onIncludeFullDebateChange?: (value: boolean) => void;
};

/** Export actions for the question bubble. */
export function SessionPromptDownloads({ exportBusy, onCopy, onDownloadMd, onDownloadPdf, isPublic, shareBusy, onShareToggle, includeFullDebate, onIncludeFullDebateChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
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
        {onShareToggle && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={cn("h-8 w-8 rounded-full", isPublic && "border-violet-400 text-violet-600 dark:text-violet-300")}
            disabled={shareBusy}
            aria-label={isPublic ? "Unshare run" : "Share run publicly"}
            title={isPublic ? "Shared publicly — click to unshare" : "Share publicly"}
            onClick={() => void onShareToggle()}
          >
            {isPublic ? <Globe className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {onIncludeFullDebateChange && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(includeFullDebate)}
            onChange={(e) => onIncludeFullDebateChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-violet-600"
          />
          Include full debate
        </label>
      )}
    </div>
  );
}
