import { useRef, useState } from "react";
import { ClipboardPaste, Paperclip } from "lucide-react";
import { AttachmentInput } from "../types";
import { readAttachments, readClipboardFromBrowser, readClipboardItems, supportedUploadTypes } from "../services/attachments";
import { Button } from "@/components/ui/button";
import { InfoTip } from "./InfoTip";
import { AttachmentChipList } from "./AttachmentChipList";
import { QuickPasteZone } from "./QuickPasteZone";

type Props = {
  attachments: AttachmentInput[];
  onAttachmentsChange: (next: AttachmentInput[]) => void;
};

export function ComposerAttachmentPanel({ attachments, onAttachmentsChange }: Props) {
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pasteHint, setPasteHint] = useState("");
  const [pasteHelp, setPasteHelp] = useState("");
  const pasteZoneRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadFiles = async (files: FileList | null) => {
    const next = await readAttachments(files);
    if (next.length) onAttachmentsChange([...attachments, ...next]);
  };

  const pasteFromClipboard = async () => {
    pasteZoneRef.current?.focus();
    setPasteBusy(true);
    setPasteHint("");
    setPasteHelp("");
    try {
      const next = await readClipboardFromBrowser();
      if (!next.length) {
        setPasteHint("Nothing pasteable found. Try Ctrl+V in the box below.");
        return;
      }
      onAttachmentsChange([...attachments, ...next]);
      setPasteHint(`Added ${next.length} item(s) from clipboard.`);
    } catch {
      setPasteHint("Clipboard read was blocked. Grant permission or use Ctrl+V in the paste box.");
      setPasteHelp("Allow clipboard access for this site, or click the paste box and press Ctrl+V (or Cmd+V).");
    } finally {
      setPasteBusy(false);
    }
  };

  const remove = (idx: number) => onAttachmentsChange(attachments.filter((_, i) => i !== idx));

  const onPaste = async (event: React.ClipboardEvent<HTMLElement>) => {
    const next = await readClipboardItems(event.clipboardData.items);
    if (!next.length) return;
    event.preventDefault();
    onAttachmentsChange([...attachments, ...next]);
    setPasteHint(`Pasted ${next.length} item(s).`);
  };

  return (
    <div onPaste={onPaste} className="grid gap-3 rounded-lg border border-border/65 bg-card/35 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/85">
          Add context files
          <InfoTip>TXT and PDF add text. Images use vision models. Size and count limits apply.</InfoTip>
        </span>
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          multiple
          accept={supportedUploadTypes()}
          onChange={(e) => loadFiles(e.target.files)}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="mr-1.5 h-4 w-4" />
            Choose files
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={pasteFromClipboard} disabled={pasteBusy}>
            <ClipboardPaste className="mr-1.5 h-4 w-4" />
            {pasteBusy ? "Reading..." : "Paste from clipboard"}
          </Button>
        </div>
      </div>
      <QuickPasteZone ref={pasteZoneRef} />
      {pasteHint && <p className="m-0 text-sm text-muted-foreground">{pasteHint}</p>}
      {pasteHelp && (
        <p className="m-0 border-l-2 border-ring/50 pl-2 text-sm text-muted-foreground">{pasteHelp}</p>
      )}
      <AttachmentChipList attachments={attachments} onRemove={remove} />
    </div>
  );
}
