import type { AttachmentFileRef, ConsultResult } from "../types";

const FILES_MARKER = "\n\nUser-provided files:\n";

/** Parses `[File: name]` lines from merged question text (legacy sessions without attachment_files). */
export function extractFileNamesFromQuestion(question: string): string[] {
  const out: string[] = [];
  const re = /\[File:\s*([^\]\n]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(question)) !== null) {
    const name = m[1].trim();
    if (name && !out.includes(name)) {
      out.push(name);
    }
  }
  return out;
}

/** Prefer API attachment list; otherwise derive placeholder refs from question text for display. */
export function attachmentListForDisplay(result: ConsultResult): AttachmentFileRef[] {
  if (result.attachment_files?.length) {
    return result.attachment_files;
  }
  return extractFileNamesFromQuestion(result.question).map((name) => ({
    name,
    mime_type: "",
    kind: "file",
    data: "",
  }));
}

/** Removes inlined file extraction block appended by the backend. */
export function stripAttachmentBlock(fullText: string): string {
  const i = fullText.indexOf(FILES_MARKER);
  if (i === -1) return fullText;
  return fullText.slice(0, i).trim();
}

/** User-facing prompt without inlined attachment extraction text. */
export function promptTextForDisplay(result: ConsultResult): string {
  const trimmed = result.base_question?.trim();
  if (trimmed) return trimmed;
  return stripAttachmentBlock(result.question ?? "");
}

/** Prompt text for exports (short form when available). */
export function promptTextForExport(result: ConsultResult): string {
  return promptTextForDisplay(result) || result.question;
}
