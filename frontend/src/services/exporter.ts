import { jsPDF } from "jspdf";
import { renderMarkdown } from "./pdfMarkdown";

type ExportData = { title: string; role: string; prompt: string; answer: string };

export function downloadMarkdown(data: ExportData): void {
  const body = `# ${data.title}\n\n## Role\n${data.role}\n\n## Prompt\n${data.prompt}\n\n## Answer\n${data.answer}\n`;
  const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safe(data.title)}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadPdf(data: ExportData): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = 76;
  y = renderMarkdown(doc, `# ${data.title}`, y);
  y = renderMarkdown(doc, `## Role\n*${data.role || "Not provided"}*`, y + 8);
  y = renderMarkdown(doc, `## Prompt\n${data.prompt || "Not provided"}`, y + 8);
  renderMarkdown(doc, `## Answer\n${data.answer || "Not provided"}`, y + 8);
  doc.save(`${safe(data.title)}.pdf`);
}

function safe(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 80) || "consensus_result";
}
