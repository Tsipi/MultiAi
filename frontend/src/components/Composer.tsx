import { useRef, useState } from "react";
import { AttachmentInput, ConsultPayload } from "../types";
import { readAttachments, readClipboardFromBrowser, readClipboardItems, supportedUploadTypes } from "../services/attachments";

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
      setPasteHelp("Browser tip: allow clipboard access for this site, then retry. If blocked by policy, click the paste box and use Ctrl+V.");
    } finally {
      setPasteBusy(false);
    }
  };

  const removeAttachment = (idx: number) =>
    props.onAttachmentsChange(props.attachments.filter((_, i) => i !== idx));

  return (
    <section className="panel panel-cheer" onPaste={handlePaste}>
      <button className="collapsible-header" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <h2 className="section-title section-title-icon">What should your AI squad solve?</h2>
        <span className={`collapse-arrow${open ? " open" : ""}`} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="collapsible-body">
          <label title="Set the expert persona: mindset, style, and constraints the AI should follow.">
            Lead Expert Role
            <input
              value={props.value.role}
              maxLength={255}
              placeholder="e.g. You are a product strategy expert who gives practical, no-fluff answers."
              onChange={(e) => set("role", e.target.value)}
            />
          </label>
          <p className="tip"><span className="tip-label">Tip:</span> Define the expert's mindset, style, and guardrails in one line.</p>
          <label title="Describe the task clearly: include output format, length constraints, and tone.">
            Your question or task
            <textarea
              value={props.value.question}
              rows={7}
              placeholder="e.g. Give 7 bullet points, max 14 words each, with zero generic advice — focused on early-stage B2B SaaS."
              onChange={(e) => set("question", e.target.value)}
            />
          </label>
          <p className="tip"><span className="tip-label">Tip:</span> Effective prompts specify format, limits, and tone.</p>
          <label title="Attach text files, PDFs, or images to give the team extra context.">
            Add context files (text, PDF, image)
            <input
              ref={fileInputRef}
              className="hidden-file-input"
              type="file"
              multiple
              accept={supportedUploadTypes()}
              onChange={(e) => loadFiles(e.target.files)}
            />
          </label>
          <div className="attachment-actions">
            <button type="button" className="primary-btn" onClick={() => fileInputRef.current?.click()}>
              Choose files
            </button>
            <button type="button" className="ghost-btn attachment-paste-btn" onClick={pasteFromClipboard} disabled={pasteBusy}>
              {pasteBusy ? "Reading clipboard..." : "Paste from clipboard"}
            </button>
          </div>
          <div ref={pasteZoneRef} className="paste-zone" role="note" tabIndex={0}>
            Paste shortcut: Click here or use Ctrl+V for screenshots and text.
          </div>
          {pasteHint && <p className="muted">{pasteHint}</p>}
          {pasteHelp && <p className="muted paste-help">{pasteHelp}</p>}
          {props.attachments.length > 0 && (
            <div className="attachment-list">
              {props.attachments.map((a, idx) => (
                <button key={`${a.name}-${idx}`} type="button" className="attachment-chip" onClick={() => removeAttachment(idx)}>
                  {a.kind.toUpperCase()}: {a.name} ✕
                </button>
              ))}
            </div>
          )}
          <p className="tip"><span className="tip-label">Tip:</span> Upload TXT/PDF for text context. Images are processed by vision-capable models.</p>
        </div>
      )}
    </section>
  );
}
