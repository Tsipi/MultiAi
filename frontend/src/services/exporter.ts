import { jsPDF } from "jspdf";
import { renderMarkdown } from "./pdfMarkdown";

export type ExportData = {
  title: string;
  role: string;
  prompt: string;
  answer: string;
  /** Local calendar date YYYY-MM-DD for the document and filename. */
  exportDate: string;
  /** Optional filename stem (safe); defaults from title + exportDate. */
  fileStem?: string;
};

/** Local date only, suitable for filenames and export stamps. */
export function exportDateLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function exportFileStem(titlePhrase: string, isoLocalDate: string): string {
  return `${safe(titlePhrase)}_${isoLocalDate}`;
}

/**
 * Attach anchor, click, remove, and revoke after delay so the browser can start the download.
 */
function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener noreferrer";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadMarkdown(data: ExportData): void {
  const title = String(data.title ?? "").trim() || "Untitled";
  const role = String(data.role ?? "");
  const prompt = String(data.prompt ?? "");
  const answer = String(data.answer ?? "");
  const dateLine = String(data.exportDate ?? "");
  const body =
    `# ${title}\n\n*Exported ${dateLine}*\n\n## Role\n${role}\n\n## Prompt\n${prompt}\n\n## Answer\n${answer}\n`;
  const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
  const stem = data.fileStem ?? exportFileStem(title, dateLine);
  triggerBlobDownload(blob, `${stem}.md`);
}

export function downloadPdf(data: ExportData): void {
  const title = String(data.title ?? "").trim() || "Untitled";
  const role = String(data.role ?? "");
  const prompt = String(data.prompt ?? "");
  const answer = String(data.answer ?? "");
  const dateLine = String(data.exportDate ?? "");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = 76;
  y = renderMarkdown(doc, `# ${title}`, y);
  y = renderMarkdown(doc, `*Exported ${dateLine}*`, y + 6);
  y = renderMarkdown(doc, `## Role\n*${role || "Not provided"}*`, y + 8);
  y = renderMarkdown(doc, `## Prompt\n${prompt || "Not provided"}`, y + 8);
  renderMarkdown(doc, `## Answer\n${answer || "Not provided"}`, y + 8);
  const stem = data.fileStem ?? exportFileStem(title, dateLine);
  try {
    const blob = doc.output("blob");
    triggerBlobDownload(blob, `${stem}.pdf`);
  } catch {
    doc.save(`${stem}.pdf`);
  }
}

function safe(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 80) || "consensus_result";
}
