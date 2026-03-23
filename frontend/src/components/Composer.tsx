import { useRef, useState } from "react";
import { ConsultPayload } from "../types";
import { AttachmentInput } from "../types";
import { readAttachments, readClipboardFromBrowser, readClipboardItems, supportedUploadTypes } from "../services/attachments";

type Props = {
  value: ConsultPayload;
  attachments: AttachmentInput[];
  onAttachmentsChange: (next: AttachmentInput[]) => void;
  onChange: (next: ConsultPayload) => void;
};

export function Composer(props: Props) {
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pasteHint, setPasteHint] = useState("");
  const [pasteHelp, setPasteHelp] = useState("");
  const pasteZoneRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const set = <K extends keyof ConsultPayload>(key: K, val: ConsultPayload[K]) =>
    props.onChange({ ...props.value, [key]: val });
  const loadFiles = async (files: FileList | null) => {
    const next = await readAttachments(files);
    if (!next.length) {
      return;
    }
    props.onAttachmentsChange([...props.attachments, ...next]);
  };
  const handlePaste = async (event: React.ClipboardEvent<HTMLElement>) => {
    const next = await readClipboardItems(event.clipboardData.items);
    if (!next.length) {
      return;
    }
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
  const removeAttachment = (idx: number) => props.onAttachmentsChange(props.attachments.filter((_, i) => i !== idx));
  return (
    <section className="panel panel-cheer" onPaste={handlePaste}>
      <h2 className="section-title section-title-icon">What should your AI squad solve?</h2>
      <label>
        Lead Expert Role
        <input
          value={props.value.role}
          maxLength={255}
          placeholder="You are a product strategy expert who gives practical, no-fluff answers."
          onChange={(e) => set("role", e.target.value)}
        />
      </label>
      <p className="tip"><span className="tip-label">Tip:</span> Define the expert's mindset, style, and guardrails in one line.</p>
      <label>
        Your question or task
        <textarea
          value={props.value.question}
          rows={7}
          placeholder="Share the mission, exact output format, and any hard constraints. Example: 'Give 7 bullet points, max 14 words each, with zero generic advice.'"
          onChange={(e) => set("question", e.target.value)}
        />
      </label>
      <p className="tip"><span className="tip-label">Tip:</span> Effective prompts specify format, limits, and tone.</p>
      <label>
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
        Paste shortcut: Click or use Ctrl+V for screenshots/text.
      </div>
      {pasteHint && <p className="muted">{pasteHint}</p>}
      {pasteHelp && <p className="muted paste-help">{pasteHelp}</p>}
      {props.attachments.length > 0 && (
        <div className="attachment-list">
          {props.attachments.map((a, idx) => (
            <button key={`${a.name}-${idx}`} type="button" className="attachment-chip" onClick={() => removeAttachment(idx)}>
              {a.kind.toUpperCase()}: {a.name} x
            </button>
          ))}
        </div>
      )}
      <p className="tip"><span className="tip-label">Tip:</span> Upload TXT/PDF for text. Images are processed by vision models.</p>
    </section>
  );
}
