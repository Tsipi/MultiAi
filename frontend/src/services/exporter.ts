import { jsPDF } from "jspdf";
import { renderMarkdown } from "./pdfMarkdown";
import AgentStudioLogo from "../../avatars/AgentStudioAssistant.png";

export type ExportParticipant = {
  name: string;
  role: "Writer" | "Critic";
  model: string;
  avatar: string;
};

export type ExportData = {
  title: string;
  role: string;
  prompt: string;
  answer: string;
  /** Local calendar date YYYY-MM-DD for the document and filename. */
  exportDate: string;
  /** Optional filename stem (safe); defaults from title + exportDate. */
  fileStem?: string;
  participants?: ExportParticipant[];
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

export async function downloadPdf(data: ExportData): Promise<void> {
  const title = String(data.title ?? "").trim() || "Untitled";
  const role = String(data.role ?? "");
  const prompt = String(data.prompt ?? "");
  const answer = String(data.answer ?? "");
  const dateLine = String(data.exportDate ?? "");

  const [logoDataUrl, watermarkDataUrl] = await Promise.all([
    loadImageDataUrl(AgentStudioLogo, 1.0),
    loadImageDataUrl(AgentStudioLogo, 0.055),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Header: logo + app name on page 1
  const logoSz = 32;
  doc.addImage(logoDataUrl, "PNG", 48, 14, logoSz, logoSz);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(109, 40, 217); // violet-700
  doc.text("MultiAi Consensus", 48 + logoSz + 7, 35);
  doc.setTextColor(0, 0, 0);

  // Thin divider below header
  doc.setDrawColor(220, 210, 240);
  doc.setLineWidth(0.5);
  doc.line(48, 54, pageW - 48, 54);

  // Content
  let y = 72;
  y = renderMarkdown(doc, `# ${title}`, y);

  // Team participants panel (just below title)
  if (data.participants?.length) {
    y = await drawParticipants(doc, data.participants, y + 4);
    doc.setDrawColor(225, 215, 245);
    doc.setLineWidth(0.4);
    doc.line(48, y, pageW - 48, y);
    y += 10;
  }

  y = renderMarkdown(doc, `*Exported ${dateLine}*`, y + 6);
  y = renderMarkdown(doc, `## Role\n*${role || "Not provided"}*`, y + 8);
  y = renderMarkdown(doc, `## Prompt\n${prompt || "Not provided"}`, y + 8);
  renderMarkdown(doc, `## Answer\n${answer || "Not provided"}`, y + 8);

  // Watermark on every page (drawn last so it sits above content at ~5% opacity)
  const totalPages = (doc.internal as any).getNumberOfPages?.() ?? 1;
  const wmSz = Math.min(pageW, pageH) * 0.55;
  const wmX = (pageW - wmSz) / 2;
  const wmY = (pageH - wmSz) / 2;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.addImage(watermarkDataUrl, "PNG", wmX, wmY, wmSz, wmSz);
  }

  const stem = data.fileStem ?? exportFileStem(title, dateLine);
  try {
    triggerBlobDownload(doc.output("blob"), `${stem}.pdf`);
  } catch {
    doc.save(`${stem}.pdf`);
  }
}

async function drawParticipants(
  doc: jsPDF,
  participants: ExportParticipant[],
  y: number
): Promise<number> {
  const pageW = doc.internal.pageSize.getWidth();
  const avatarPt = 24;
  // Always try to fit all on one row; max 5 per row, wrap beyond that
  const maxPerRow = Math.min(participants.length, 5);
  const colW = Math.floor((pageW - 96) / maxPerRow);

  const avatarUrls = await Promise.all(participants.map((p) => loadCircularAvatar(p.avatar, 56)));

  // "PARTICIPANTS" label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(130, 100, 190);
  doc.text("PARTICIPANTS", 48, y);
  y += 12;

  let x = 48;
  let rowY = y;

  for (let i = 0; i < participants.length; i++) {
    if (i > 0 && i % maxPerRow === 0) {
      rowY += avatarPt + 16;
      x = 48;
    }

    const p = participants[i];
    const url = avatarUrls[i];

    // Avatar — circular photo or coloured initials fallback
    if (url) {
      doc.addImage(url, "PNG", x, rowY, avatarPt, avatarPt);
    } else {
      const initials = p.name.split(" ").map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase();
      const isWriter = p.role === "Writer";
      doc.setFillColor(isWriter ? 124 : 59, isWriter ? 58 : 130, isWriter ? 237 : 246);
      doc.circle(x + avatarPt / 2, rowY + avatarPt / 2, avatarPt / 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(initials, x + avatarPt / 2, rowY + avatarPt / 2 + 3, { align: "center" });
    }

    const tx = x + avatarPt + 5;

    // First name bold
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 20, 60);
    doc.text(p.name.split(" ")[0], tx, rowY + 9);

    // Role label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(110, 90, 160);
    doc.text(p.role, tx, rowY + 18);

    // Provider badge — full name, dynamic width
    const prov = pdfProvider(p.model);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    const nameW = doc.getTextWidth(prov.name);
    const bw = nameW + 8;
    const bx = tx;
    const by = rowY + 20;
    doc.setFillColor(prov.r, prov.g, prov.b);
    doc.roundedRect(bx, by, bw, 8, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(prov.name, bx + bw / 2, by + 5.8, { align: "center" });

    x += colW;
  }

  doc.setTextColor(0, 0, 0);
  return rowY + avatarPt + 14;
}

function loadCircularAvatar(src: string, sizePx: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = sizePx;
      canvas.height = sizePx;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.beginPath();
      ctx.arc(sizePx / 2, sizePx / 2, sizePx / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0, sizePx, sizePx);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function pdfProvider(modelId: string): { name: string; r: number; g: number; b: number } {
  const id = modelId.toLowerCase();
  if (id.includes("openai") || id.includes("gpt"))       return { name: "OpenAI",   r: 16,  g: 163, b: 127 };
  if (id.includes("anthropic") || id.includes("claude")) return { name: "Claude",   r: 217, g: 119, b: 6   };
  if (id.includes("google") || id.includes("gemini"))    return { name: "Gemini",   r: 66,  g: 133, b: 244 };
  if (id.includes("deepseek"))                           return { name: "DeepSeek", r: 29,  g: 78,  b: 216 };
  if (id.includes("meta-llama") || id.includes("llama")) return { name: "Llama",    r: 79,  g: 70,  b: 229 };
  if (id.includes("mistral"))                            return { name: "Mistral",  r: 234, g: 88,  b: 12  };
  return { name: "AI", r: 100, g: 90, b: 130 };
}

function loadImageDataUrl(src: string, opacity: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.globalAlpha = opacity;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

function safe(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 80) || "consensus_result";
}
