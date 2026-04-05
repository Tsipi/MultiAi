import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AttachmentInput, ConsultPayload } from "../types";
import { readAttachments, readClipboardFromBrowser, readClipboardItems, supportedUploadTypes } from "../services/attachments";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: ConsultPayload;
  attachments: AttachmentInput[];
  onAttachmentsChange: (next: AttachmentInput[]) => void;
  onChange: (next: ConsultPayload) => void;
};

export function Composer(props: Props) {
  const [open, setOpen] = useState(true);
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pasteHint, setPasteHint] = useState("");
  const [pasteHelp, setPasteHelp] = useState("");
  const pasteZoneRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const set = <K extends keyof ConsultPayload>(key: K, val: ConsultPayload[K]) =>
    props.onChange({ ...props.value, [key]: val });

  const loadFiles = async (files: FileList | null) => {
    const next = await readAttachments(files);
    if (next.length) props.onAttachmentsChange([...props.attachments, ...next]);
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLElement>) => {
    const next = await readClipboardItems(event.clipboardData.items);
    if (!next.length) return;
    event.preventDefault();
    props.onAttachmentsChange([...props.attachments, ...next]);
    setPasteHint(`Pasted ${next.length} item(s).`);
  };

  const pasteFromClipboard = async () => {
    pasteZoneRef.current?.focus();
    setPasteBusy(true);
    setPasteHint("");
    setPasteHelp("");
    try {
      const next = await readClipboardFromBrowser();
      if (!next.length) {
        setPasteHint("Nothing pasteable found. Try Ctrl+V in the paste box.");
        return;
      }
      props.onAttachmentsChange([...props.attachments, ...next]);
      setPasteHint(`Added ${next.length} item(s) from clipboard.`);
    } catch {
      setPasteHint("Clipboard read was blocked. Grant permission or use Ctrl+V in the paste box.");
      setPasteHelp(
        "Browser tip: allow clipboard access for this site, then retry. If blocked by policy, click the paste box and use Ctrl+V."
      );
    } finally {
      setPasteBusy(false);
    }
  };

  const removeAttachment = (idx: number) =>
    props.onAttachmentsChange(props.attachments.filter((_, i) => i !== idx));

  return (
    <section className="glass-panel glass-panel-cheer glass-panel-hover p-4" onPaste={handlePaste}>
      {/* Collapsible header */}
      <button
        className="w-full flex items-center justify-between bg-transparent border-0 shadow-none cursor-pointer p-0 mb-0"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <h2 className="flex items-center gap-2.5 text-[1.06rem] font-semibold tracking-tight m-0">
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-300 to-green-400 flex-shrink-0 shadow-[0_0_0_3px_rgba(158,199,255,0.25)]" />
          What should your AI squad solve?
        </h2>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-150 flex-shrink-0",
            open ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>

      {open && (
        <div className="grid gap-3 mt-4">
          <Label title="Set the expert persona: mindset, style, and constraints the AI should follow.">
            Lead Expert Role
            <Input
              value={props.value.role}
              maxLength={255}
              placeholder="e.g. You are a product strategy expert who gives practical, no-fluff answers."
              onChange={(e) => set("role", e.target.value)}
            />
          </Label>
          <p className="text-[0.9rem] text-muted-foreground m-0 -mt-1">
            <span className="font-bold text-foreground/85 mr-1">Tip:</span>
            Define the expert's mindset, style, and guardrails in one line.
          </p>

          <Label title="Describe the task clearly: include output format, length constraints, and tone.">
            Your question or task
            <Textarea
              value={props.value.question}
              rows={7}
              placeholder="e.g. Give 7 bullet points, max 14 words each, with zero generic advice — focused on early-stage B2B SaaS."
              onChange={(e) => set("question", e.target.value)}
            />
          </Label>
          <p className="text-[0.9rem] text-muted-foreground m-0 -mt-1">
            <span className="font-bold text-foreground/85 mr-1">Tip:</span>
            Effective prompts specify format, limits, and tone.
          </p>

          {/* File attachment */}
          <Label title="Attach text files, PDFs, or images to give the team extra context.">
            Add context files (text, PDF, image)
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              multiple
              accept={supportedUploadTypes()}
              onChange={(e) => loadFiles(e.target.files)}
            />
          </Label>
          <div className="flex items-center gap-2.5 -mt-1">
            <Button onClick={() => fileInputRef.current?.click()}>Choose files</Button>
            <Button
              variant="outline"
              onClick={pasteFromClipboard}
              disabled={pasteBusy}
              className="min-w-[180px]"
            >
              {pasteBusy ? "Reading clipboard..." : "Paste from clipboard"}
            </Button>
          </div>

          {/* Paste zone */}
          <div
            ref={pasteZoneRef}
            className="border border-dashed border-border rounded-md px-3 py-3 text-sm text-muted-foreground bg-card/80 focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            role="note"
            tabIndex={0}
          >
            Paste shortcut: Click here or use Ctrl+V for screenshots and text.
          </div>

          {pasteHint && <p className="text-sm text-muted-foreground m-0">{pasteHint}</p>}
          {pasteHelp && (
            <p className="text-sm text-muted-foreground border-l-2 border-ring/50 pl-2 m-0">
              {pasteHelp}
            </p>
          )}

          {props.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {props.attachments.map((a, idx) => (
                <button
                  key={`${a.name}-${idx}`}
                  type="button"
                  className="inline-flex items-center gap-1 rounded border border-border bg-card/80 px-2.5 py-1 text-xs text-foreground shadow-none hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-colors cursor-pointer"
                  onClick={() => removeAttachment(idx)}
                >
                  {a.kind.toUpperCase()}: {a.name} ✕
                </button>
              ))}
            </div>
          )}

          <p className="text-[0.9rem] text-muted-foreground m-0">
            <span className="font-bold text-foreground/85 mr-1">Tip:</span>
            Upload TXT/PDF for text context. Images are processed by vision-capable models.
          </p>
        </div>
      )}
    </section>
  );
}
