import { jsPDF } from "jspdf";
import { TEAM_TEMPLATES, TEMPLATE_ICONS, roleDescriptionFromText } from "@/data/templates";
import { ensurePageSpace, renderMarkdown, type PageHeaderFn } from "./pdfMarkdown";
import { drawPageHeader, drawPageNumbers, drawWatermarks } from "./pdfHeader";
import { drawParticipants, drawMessageHeader, drawRoundDivider, type ExportParticipant, type ExportDebateMessage } from "./pdfParticipants";
import { loadBrandMarkDataUrl, loadIconDataUrl } from "./pdfIcons";
import { PDF } from "./pdfTheme";
import { enableUnicodeFont, resetFontFamily } from "./pdfFont";
import { documentNeedsUnicodeFont } from "./pdfText";
import { contentWidth, divider, drawSectionLabel, font, resetColor, textColor } from "./pdfUtils";
import AgentStudioLogo from "../../../avatars/AgentStudioAssistant.png";

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
  followup?: {
    originalPrompt: string;
    previousFinalAnswer: string;
    revisedAnswerLabel?: string;
  };
  webResearch?: {
    mode: "off" | "auto" | "on";
    performed: boolean;
    query: string;
    retrievedAt: string;
    sources: Array<{ title: string; url: string }>;
    warning: string;
  };
};

export function exportDateLocal(): string {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Human-readable stamp for the page header: `DD/MM/YYYY hh:mm`.
 * Kept separate from `exportDateLocal`, which feeds the filename and must stay
 * filesystem-safe — slashes and colons are not valid there.
 */
export function exportTimestampLabel(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}`
  );
}

export function exportFileStem(titlePhrase: string, isoLocalDate: string): string {
  return `${safe(titlePhrase)}_${isoLocalDate}`;
}

export function downloadMarkdown(data: ExportData): void {
  const title = capitalizeFirst(clean(data.title, "Untitled"));
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
  const title = capitalizeFirst(clean(data.title, "Untitled"));
  const role = clean(data.role);
  const prompt = clean(data.prompt);
  const answer = clean(data.answer);
  const exportDate = clean(data.exportDate);

  const activeTemplate = data.teamName ? TEAM_TEMPLATES.find((t) => t.name === data.teamName) : undefined;

  const [brandMarkDataUrl, watermarkDataUrl] = await Promise.all([
    loadBrandMarkDataUrl(96),
    loadImageDataUrl(AgentStudioLogo, 0.05),
  ]);
  const headerMark = brandMarkDataUrl ?? (await loadImageDataUrl(AgentStudioLogo, 1));
  const exportedAt = exportTimestampLabel();

  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  resetFontFamily();
  if (documentNeedsUnicodeFont([title, role, prompt, answer, data.followup?.originalPrompt, data.followup?.previousFinalAnswer])) {
    await enableUnicodeFont(doc);
  }

  let y = drawPageHeader(doc, headerMark, title, false, exportedAt);

  const headerFn: PageHeaderFn = (d) => {
    return drawPageHeader(d, headerMark, title, true);
  };

  y = drawSectionLabel(doc, data.followup ? "Follow-up Prompt" : "Prompt", y) + 6;
  y = renderMarkdown(doc, `# ${capitalizeFirst(title)}`, y, headerFn);

  // Parent question as a compact muted line, mirroring "Follow-up to:" on the shared page.
  const followupParent = data.followup ? data.followup.originalPrompt || prompt : "";
  if (followupParent) {
    font(doc, "normal", PDF.fontSize.meta);
    textColor(doc, PDF.colors.gray);

    for (const line of doc.splitTextToSize(`Follow-up to: ${followupParent}`, contentWidth(doc)) as string[]) {
      y = ensurePageSpace(doc, y, 12, headerFn);
      doc.text(line, PDF.marginX, y);
      y += 12;
    }

    resetColor(doc);
  }

  /** Horizontal rule between major sections, with breathing room on both sides. */
  const sectionBreak = (at: number): number => {
    const ruleY = ensurePageSpace(doc, at + 10, 24, headerFn);
    divider(doc, ruleY, PDF.colors.dividerStrong, 0.5);
    return ruleY + 16;
  };

  y = sectionBreak(y);

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

  // The heading carries the question and the "Follow-up to:" line above carries the parent
  // prompt, so neither is repeated here. Only the parent's answer still needs a section.
  if (data.followup) {
    y = drawSectionLabel(doc, "Previous Final Answer", y + 8) + 6;
    y = renderMarkdown(doc, data.followup.previousFinalAnswer || "Not provided", y, headerFn);
  }

  y = drawSectionLabel(doc, data.followup?.revisedAnswerLabel || "Answer", sectionBreak(y)) + 6;
  y = renderMarkdown(doc, `${answer || "Not provided"}`, y, headerFn);

  if (data.debateRounds?.length) {
    y = drawSectionLabel(doc, "Full Debate", sectionBreak(y));

    for (const round of data.debateRounds) {
      y = drawRoundDivider(doc, round.round_num, data.roundCount, y + 8, headerFn);

      y = await drawMessageHeader(doc, round.writerMessage, y + 2, headerFn);
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

  if (data.webResearch) {
    y += 12;
    divider(doc, y, PDF.colors.dividerStrong);
    y = drawSectionLabel(doc, webResearchTitle(data.webResearch), y + 18);
    y = renderMarkdown(doc, webResearchMarkdown(data.webResearch), y, headerFn);
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
    `*Exported ${data.exportDate}*\n\n`;

  if (data.role) {
    body += `## Role\n${data.role}\n\n`;
  }

  if (data.followup) {
    body +=
      `## Original Prompt\n${data.followup.originalPrompt || data.prompt || "Not provided"}\n\n` +
      `## Previous Final Answer\n${data.followup.previousFinalAnswer || "Not provided"}\n\n` +
      `## ${data.followup.revisedAnswerLabel || "Revised Answer"}\n${data.answer || "Not provided"}\n`;
  } else {
    body +=
      `## Prompt\n${data.prompt || "Not provided"}\n\n` +
      `## Answer\n${data.answer || "Not provided"}\n`;
  }

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

  if (data.webResearch) {
    body += `\n## ${webResearchTitle(data.webResearch)}\n\n${webResearchMarkdown(data.webResearch)}\n`;
  }

  return body;
}

function webResearchMarkdown(research: NonNullable<ExportData["webResearch"]>): string {
  const lines = [
    research.retrievedAt ? `Retrieved: ${formatExportDateTime(research.retrievedAt)}` : "",
    research.query ? `Search query: ${research.query}` : "",
    research.warning ? `Warning: ${research.warning}` : "",
  ].filter(Boolean);

  if (research.sources.length) {
    lines.push("", ...research.sources.map((source) => `- [${source.title || source.url}](${source.url})`));
  }

  return lines.join("\n");
}

function webResearchTitle(research: NonNullable<ExportData["webResearch"]>): string {
  if (research.performed) return "Live web research used";
  if (research.warning) return "Live web research unavailable";
  return "Web research not used";
}

function formatExportDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
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
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  // A fully non-Latin title (e.g. Hebrew) reduces to separators, which would produce a
  // filename like "__2026-08-06.pdf". Fall back to a readable ASCII stem instead.
  return /[a-z0-9]/.test(slug) ? slug : "teamstoa_export";
}

function clean(value: unknown, fallback = ""): string {
  return String(value ?? "").trim() || fallback;
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
