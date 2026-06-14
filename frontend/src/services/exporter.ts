import { jsPDF } from "jspdf";
import { renderMarkdown, type PageHeaderFn } from "./pdfMarkdown";
import { drawPageHeader, drawPageNumbers, drawWatermarks } from "./pdfHeader";
import { drawParticipants, type ExportParticipant } from "./pdfParticipants";
import { PDF } from "./pdfTheme";
import { font, resetColor, textColor } from "./pdfUtils";
import AgentStudioLogo from "../../avatars/AgentStudioAssistant.png";

export type { ExportParticipant };

export type ExportData = {
  title: string;
  role: string;
  prompt: string;
  answer: string;
  exportDate: string;
  fileStem?: string;
  participants?: ExportParticipant[];
  consensusScore?: number;
  roundCount?: number;
  totalCostUsd?: number;
};

export function exportDateLocal(): string {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function exportFileStem(titlePhrase: string, isoLocalDate: string): string {
  return `${safe(titlePhrase)}_${isoLocalDate}`;
}

export function downloadMarkdown(data: ExportData): void {
  const title = clean(data.title, "Untitled");
  const exportDate = clean(data.exportDate);

  const body = buildMarkdownBody({
    ...data,
    title,
    role: clean(data.role),
    prompt: clean(data.prompt),
    answer: clean(data.answer),
    exportDate,
  });

  const blob = new Blob([body], {
    type: "text/markdown;charset=utf-8",
  });

  const stem = data.fileStem ?? exportFileStem(title, exportDate);
  triggerBlobDownload(blob, `${stem}.md`);
}

export async function downloadPdf(data: ExportData): Promise<void> {
  const title = clean(data.title, "Untitled");
  const role = clean(data.role);
  const prompt = clean(data.prompt);
  const answer = clean(data.answer);
  const exportDate = clean(data.exportDate);

  const [logoDataUrl, watermarkDataUrl] = await Promise.all([
    loadImageDataUrl(AgentStudioLogo, 1),
    loadImageDataUrl(AgentStudioLogo, 0.05),
  ]);

  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  let y = drawPageHeader(doc, logoDataUrl, title, false);

  const headerFn: PageHeaderFn = (d) => {
    return drawPageHeader(d, logoDataUrl, title, true);
  };

  y = renderMarkdown(doc, `# ${title}`, y, headerFn);

  if (data.participants?.length) {
    y = await drawParticipants(doc, data.participants, y + 4);
  }

  y = drawMeta(doc, data, y);

  y = renderMarkdown(doc, `*Exported ${exportDate}*`, y + 6, headerFn);
  y = renderMarkdown(doc, `## Role\n*${role || "Not provided"}*`, y + 8, headerFn);
  y = renderMarkdown(doc, `## Prompt\n${prompt || "Not provided"}`, y + 8, headerFn);
  y = renderMarkdown(doc, `## Answer\n${answer || "Not provided"}`, y + 8, headerFn);

  const totalPages = getPageCount(doc);

  drawWatermarks(doc, watermarkDataUrl, totalPages);
  drawPageNumbers(doc, totalPages);

  const stem = data.fileStem ?? exportFileStem(title, exportDate);

  try {
    triggerBlobDownload(doc.output("blob"), `${stem}.pdf`);
  } catch {
    doc.save(`${stem}.pdf`);
  }
}

function drawMeta(doc: jsPDF, data: ExportData, y: number): number {
  const parts: string[] = [];

  if (data.consensusScore != null) {
    parts.push(`Score: ${data.consensusScore.toFixed(1)} / 10`);
  }

  if (data.roundCount != null) {
    parts.push(`${data.roundCount} round${data.roundCount === 1 ? "" : "s"}`);
  }

  if (data.totalCostUsd != null) {
    parts.push(`~$${data.totalCostUsd.toFixed(4)}`);
  }

  if (!parts.length) {
    return y;
  }

  font(doc, "normal", PDF.fontSize.meta);
  textColor(doc, PDF.colors.muted);

  doc.text(parts.join("  ·  "), PDF.marginX, y);

  resetColor(doc);

  return y + 14;
}

function buildMarkdownBody(data: ExportData): string {
  let body =
    `# ${data.title}\n\n` +
    `*Exported ${data.exportDate}*\n\n` +
    `## Role\n${data.role || "Not provided"}\n\n` +
    `## Prompt\n${data.prompt || "Not provided"}\n\n` +
    `## Answer\n${data.answer || "Not provided"}\n`;

  return body;
}

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

function loadImageDataUrl(src: string, opacity: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }

      ctx.globalAlpha = opacity;
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = reject;
    img.src = src;
  });
}

function getPageCount(doc: jsPDF): number {
  return (doc.internal as any).getNumberOfPages?.() ?? 1;
}

function safe(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 80) || "consensus_result"
  );
}

function clean(value: unknown, fallback = ""): string {
  return String(value ?? "").trim() || fallback;
}