import { jsPDF } from "jspdf";
import { TEAM_TEMPLATES, TEMPLATE_ICONS, roleDescriptionFromText } from "@/data/templates";
import { renderMarkdown, type PageHeaderFn } from "./pdfMarkdown";
import { drawPageHeader, drawPageNumbers, drawWatermarks } from "./pdfHeader";
import { drawParticipants, drawMessageHeader, type ExportParticipant, type ExportDebateMessage } from "./pdfParticipants";
import { loadIconDataUrl } from "./pdfIcons";
import { PDF } from "./pdfTheme";
import { drawSectionLabel, font, resetColor, textColor } from "./pdfUtils";
import AgentStudioLogo from "../../avatars/AgentStudioAssistant.png";

export type { ExportParticipant, ExportDebateMessage };

export type ExportDebateRound = {
  round_num: number;
  writerMessage: ExportDebateMessage;
  criticMessages: ExportDebateMessage[];
  summary: string;
};

export type ExportData = {
  title: string;
  role: string;
  prompt: string;
  answer: string;
  exportDate: string;
  fileStem?: string;
  participants?: ExportParticipant[];
  teamName?: string;
  consensusScore?: number;
  roundCount?: number;
  totalCostUsd?: number;
  debateRounds?: ExportDebateRound[];
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

  const activeTemplate = data.teamName ? TEAM_TEMPLATES.find((t) => t.name === data.teamName) : undefined;

  const [logoDataUrl, watermarkDataUrl] = await Promise.all([
    loadImageDataUrl(AgentStudioLogo, 1),
    loadImageDataUrl(AgentStudioLogo, 0.05),
  ]);

  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  let y = drawPageHeader(doc, logoDataUrl, title, false, exportDate);

  const headerFn: PageHeaderFn = (d) => {
    return drawPageHeader(d, logoDataUrl, title, true);
  };

  y = renderMarkdown(doc, `# ${title}`, y, headerFn);

  if (data.participants?.length) {
    const templateIcon = activeTemplate ? TEMPLATE_ICONS[activeTemplate.id] : undefined;
    const iconDataUrl = templateIcon ? await loadIconDataUrl(templateIcon, PDF.colors.brand, 26) : null;
    const writerMember = activeTemplate?.members.find((m) => m.duty === "writer");
    const rawDescription = (writerMember && roleDescriptionFromText(writerMember.role)) || activeTemplate?.description;
    const sectionDescription = rawDescription ? capitalizeFirst(rawDescription) : undefined;

    y = await drawParticipants(doc, data.participants, y + 4, data.teamName, sectionDescription, iconDataUrl);
  }

  y = drawMeta(doc, data, y);

  if (!activeTemplate) {
    y = drawSectionLabel(doc, "Role", y + 8);
    y = renderMarkdown(doc, `*${role || "Not provided"}*`, y, headerFn);
  }

  y = drawSectionLabel(doc, "Prompt", y + 8);
  y = renderMarkdown(doc, prompt || "Not provided", y, headerFn);

  y = drawSectionLabel(doc, "Answer", y + 8);
  y = renderMarkdown(doc, `${answer || "Not provided"}`, y + 8, headerFn);

  if (data.debateRounds?.length) {
    y = drawSectionLabel(doc, "Full Debate", y + 12);

    for (const round of data.debateRounds) {
      y = renderMarkdown(doc, `### Round ${round.round_num}`, y + 8, headerFn);

      y = await drawMessageHeader(doc, round.writerMessage, y + 4, headerFn);
      y = renderMarkdown(doc, round.writerMessage.text || "Not provided", y + 2, headerFn);

      for (const critique of round.criticMessages) {
        y = await drawMessageHeader(doc, critique, y + 8, headerFn);
        y = renderMarkdown(doc, critique.text || "Not provided", y + 2, headerFn);
      }

      y = renderMarkdown(
        doc,
        `**Round Summary**\n\n${round.summary || "Not provided"}`,
        y + 8,
        headerFn
      );
    }
  }

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
  const parts: { text: string; color: string; bold: boolean }[] = [];

  if (data.consensusScore != null) {
    parts.push({ text: `Score: ${data.consensusScore.toFixed(1)} / 10`, color: PDF.colors.score, bold: true });
  }

  if (data.roundCount != null) {
    parts.push({ text: `${data.roundCount} round${data.roundCount === 1 ? "" : "s"}`, color: PDF.colors.gray, bold: false });
  }

  if (data.totalCostUsd != null) {
    parts.push({ text: `~$${data.totalCostUsd.toFixed(4)}`, color: PDF.colors.gray, bold: false });
  }

  if (!parts.length) {
    return y;
  }

  const pageW = doc.internal.pageSize.getWidth();
  const sep = "   ·   ";

  font(doc, "normal", PDF.fontSize.meta);
  const sepW = doc.getTextWidth(sep);

  const widths = parts.map((p) => {
    font(doc, p.bold ? "bold" : "normal", PDF.fontSize.meta);
    return doc.getTextWidth(p.text);
  });

  const totalW = widths.reduce((sum, w) => sum + w, 0) + sepW * (parts.length - 1);
  let x = pageW - PDF.marginX - totalW;

  parts.forEach((p, i) => {
    if (i > 0) {
      font(doc, "normal", PDF.fontSize.meta);
      textColor(doc, PDF.colors.gray);
      doc.text(sep, x, y);
      x += sepW;
    }

    font(doc, p.bold ? "bold" : "normal", PDF.fontSize.meta);
    textColor(doc, p.color);
    doc.text(p.text, x, y);
    x += widths[i];
  });

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

  if (data.debateRounds?.length) {
    body += "\n## Full Debate\n";

    for (const round of data.debateRounds) {
      body += `\n### Round ${round.round_num}\n\n`;

      body += `**${round.writerMessage.name} (${round.writerMessage.role})**\n\n${round.writerMessage.text || "Not provided"}\n\n`;

      for (const critique of round.criticMessages) {
        body += `**${critique.name} (${critique.role})**\n\n${critique.text || "Not provided"}\n\n`;
      }

      body += `**Round Summary**\n\n${round.summary || "Not provided"}\n`;
    }
  }

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

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}