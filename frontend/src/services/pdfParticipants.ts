import type { jsPDF } from "jspdf";
import { PDF } from "./pdfTheme";
import { ensurePageSpace, type PageHeaderFn } from "./pdfMarkdown";
import { contentWidth, divider, drawSectionLabel, fillColor, font, resetColor, textColor } from "./pdfUtils";

export type ExportParticipant = {
  name: string;
  role: "Writer" | "Critic";
  roleSummary?: string;
  model: string;
  avatar: string;
};

export type ExportDebateMessage = {
  name: string;
  role: "Writer" | "Critic";
  model: string;
  avatar: string;
  text: string;
};

type AvatarSubject = {
  name: string;
  role: "Writer" | "Critic";
};

export type PdfProvider = {
  name: string;
  color: string;
};

export async function drawParticipants(
  doc: jsPDF,
  participants: ExportParticipant[],
  y: number,
  sectionTitle?: string,
  sectionDescription?: string,
  iconDataUrl?: string | null
): Promise<number> {
  const avatarSize = 24;
  const iconSize = 13;
  const numColumns = participants.length >= 3 ? 3 : 1;
  const colGap = 16;
  const colWidth = (contentWidth(doc) - colGap * (numColumns - 1)) / numColumns;
  const rowHeight = numColumns > 1 ? 50 : 44;
  const textWidth = colWidth - avatarSize - 8;

  const avatarUrls = await Promise.all(
    participants.map((p) => loadCircularAvatar(p.avatar, 56))
  );

  if (iconDataUrl) {
    doc.addImage(iconDataUrl, "PNG", PDF.marginX, y - iconSize + 2, iconSize, iconSize);
  }

  y = drawSectionLabel(doc, sectionTitle || "Team Members", y, iconDataUrl ? iconSize + 5 : 0);

  if (sectionDescription) {
    font(doc, "normal", 9.5);
    textColor(doc, PDF.colors.gray);
    const lines = doc.splitTextToSize(sectionDescription, contentWidth(doc));
    doc.text(lines, PDF.marginX, y - 2);
    resetColor(doc);
    y += lines.length * 11;
  }

  participants.forEach((participant, i) => {
    const col = i % numColumns;
    const row = Math.floor(i / numColumns);
    const colX = PDF.marginX + col * (colWidth + colGap);
    const rowY = y + row * rowHeight;

    drawAvatar(doc, participant, avatarUrls[i], colX, rowY, avatarSize);
    drawParticipantText(doc, participant, colX + avatarSize + 8, rowY, textWidth);
  });

  resetColor(doc);

  const numRows = Math.ceil(participants.length / numColumns);
  const endY = y + numRows * rowHeight + 4;
  divider(doc, endY, PDF.colors.dividerStrong);

  return endY + 10;
}

export function drawAvatar(
  doc: jsPDF,
  subject: AvatarSubject,
  avatarUrl: string | null,
  x: number,
  y: number,
  size: number
): void {
  if (avatarUrl) {
    doc.addImage(avatarUrl, "PNG", x, y, size, size);
    return;
  }

  const initials = subject.name
    .split(" ")
    .map((word) => word[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  fillColor(doc, subject.role === "Writer" ? PDF.colors.writer : PDF.colors.criticAccent);
  doc.circle(x + size / 2, y + size / 2, size / 2, "F");

  font(doc, "bold", 8);
  textColor(doc, PDF.colors.white);
  doc.text(initials, x + size / 2, y + size / 2 + 3, {
    align: "center",
  });
}

/** Draws an avatar + name + role badge + provider badge for one debate message (used in the "Full Debate" export). */
export async function drawMessageHeader(
  doc: jsPDF,
  message: ExportDebateMessage,
  y: number,
  headerFn?: PageHeaderFn
): Promise<number> {
  const avatarSize = 22;

  y = ensurePageSpace(doc, y, avatarSize + 4, headerFn);

  const avatarUrl = await loadCircularAvatar(message.avatar, 56);
  const x = PDF.marginX;
  const isWriter = message.role === "Writer";

  drawAvatar(doc, message, avatarUrl, x, y, avatarSize);

  const textX = x + avatarSize + 8;
  const textY = y + avatarSize / 2 + 3;
  const firstName = message.name.split(" ")[0] || message.name;

  font(doc, "bold", 10);
  textColor(doc, PDF.colors.participantName);
  doc.text(firstName, textX, textY);

  const nameW = doc.getTextWidth(firstName);
  const roleLabel = message.role.toUpperCase();

  font(doc, "bold", 7);
  textColor(doc, isWriter ? PDF.colors.writer : PDF.colors.criticAccent);
  doc.text(roleLabel, textX + nameW + 6, textY);

  const roleW = doc.getTextWidth(roleLabel);
  const provider = pdfProvider(message.model);
  drawProviderBadge(doc, provider, textX + nameW + roleW + 12, y + avatarSize / 2 - 4);

  resetColor(doc);

  return y + avatarSize + 6;
}

function drawParticipantText(
  doc: jsPDF,
  participant: ExportParticipant,
  x: number,
  y: number,
  maxTextWidth: number
): void {
  const firstName = participant.name.split(" ")[0] || participant.name;
  const provider = pdfProvider(participant.model);
  const isWriter = participant.role === "Writer";

  font(doc, "bold", 9);
  textColor(doc, PDF.colors.participantName);
  doc.text(firstName, x, y + 9);

  const nameW = doc.getTextWidth(firstName);
  const roleLabel = participant.role.toUpperCase();

  font(doc, "bold", 6.5);
  textColor(doc, isWriter ? PDF.colors.writer : PDF.colors.criticAccent);
  doc.text(roleLabel, x + nameW + 6, y + 9);

  let summaryLines: string[] = [];

  if (participant.roleSummary) {
    font(doc, "normal", 7.5);
    textColor(doc, PDF.colors.gray);
    summaryLines = doc.splitTextToSize(participant.roleSummary, maxTextWidth);
    doc.text(summaryLines, x, y + 19);
  }

  drawProviderBadge(doc, provider, x, y + 14 + summaryLines.length * 9);
}

export function drawProviderBadge(
  doc: jsPDF,
  provider: PdfProvider,
  x: number,
  y: number
): void {
  font(doc, "bold", 6.5);

  const nameW = doc.getTextWidth(provider.name);
  const badgeW = nameW + 8;

  fillColor(doc, provider.color);
  doc.roundedRect(x, y, badgeW, 8, 1.5, 1.5, "F");

  textColor(doc, PDF.colors.white);
  doc.text(provider.name, x + badgeW / 2, y + 5.8, {
    align: "center",
  });
}

// Colors mirror ModelProviderIcon's resolveProvider() badge backgrounds, for consistency with the app.
export function pdfProvider(modelId: string): PdfProvider {
  const id = modelId.toLowerCase();

  if (id.includes("openai") || id.includes("gpt")) {
    return { name: "OpenAI", color: "#059669" }; // emerald-600
  }

  if (id.includes("anthropic") || id.includes("claude")) {
    return { name: "Claude", color: "#B45309" }; // amber-700
  }

  if (id.includes("google") || id.includes("gemini")) {
    return { name: "Gemini", color: "#3B82F6" }; // blue-500
  }

  if (id.includes("deepseek")) {
    return { name: "DeepSeek", color: "#2563EB" }; // blue-600
  }

  if (id.includes("meta-llama") || id.includes("llama")) {
    return { name: "Llama", color: "#4F46E5" }; // indigo-600
  }

  if (id.includes("mistral")) {
    return { name: "Mistral", color: "#EA580C" }; // orange-600
  }

  return {
    name: "AI",
    color: PDF.colors.gray,
  };
}

export function loadCircularAvatar(src: string, sizePx: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = sizePx;
      canvas.height = sizePx;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(null);
        return;
      }

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