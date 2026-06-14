import type { jsPDF } from "jspdf";
import { PDF } from "./pdfTheme";
import { divider, fillColor, font, resetColor, textColor } from "./pdfUtils";

export type ExportParticipant = {
  name: string;
  role: "Writer" | "Critic";
  model: string;
  avatar: string;
};

type PdfProvider = {
  name: string;
  color: string;
};

export async function drawParticipants(
  doc: jsPDF,
  participants: ExportParticipant[],
  y: number
): Promise<number> {
  const pageW = doc.internal.pageSize.getWidth();
  const avatarSize = 24;
  const maxPerRow = Math.min(participants.length, 5);
  const colW = Math.floor((pageW - PDF.marginX * 2) / maxPerRow);

  const avatarUrls = await Promise.all(
    participants.map((p) => loadCircularAvatar(p.avatar, 56))
  );

  font(doc, "bold", 7);
  textColor(doc, PDF.colors.participantTitle);
  doc.text("PARTICIPANTS", PDF.marginX, y);

  y += 12;

  let x = PDF.marginX;
  let rowY = y;

  participants.forEach((participant, i) => {
    if (i > 0 && i % maxPerRow === 0) {
      rowY += avatarSize + 16;
      x = PDF.marginX;
    }

    drawAvatar(doc, participant, avatarUrls[i], x, rowY, avatarSize);
    drawParticipantText(doc, participant, x + avatarSize + 5, rowY);

    x += colW;
  });

  resetColor(doc);

  const endY = rowY + avatarSize + 14;
  divider(doc, endY, PDF.colors.dividerStrong);

  return endY + 10;
}

function drawAvatar(
  doc: jsPDF,
  participant: ExportParticipant,
  avatarUrl: string | null,
  x: number,
  y: number,
  size: number
): void {
  if (avatarUrl) {
    doc.addImage(avatarUrl, "PNG", x, y, size, size);
    return;
  }

  const initials = participant.name
    .split(" ")
    .map((word) => word[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  fillColor(doc, participant.role === "Writer" ? PDF.colors.writer : PDF.colors.critic);
  doc.circle(x + size / 2, y + size / 2, size / 2, "F");

  font(doc, "bold", 8);
  textColor(doc, PDF.colors.white);
  doc.text(initials, x + size / 2, y + size / 2 + 3, {
    align: "center",
  });
}

function drawParticipantText(
  doc: jsPDF,
  participant: ExportParticipant,
  x: number,
  y: number
): void {
  const firstName = participant.name.split(" ")[0] || participant.name;
  const provider = pdfProvider(participant.model);

  font(doc, "bold", 8.5);
  textColor(doc, PDF.colors.participantName);
  doc.text(firstName, x, y + 9);

  font(doc, "normal", 7);
  textColor(doc, PDF.colors.muted);
  doc.text(participant.role, x, y + 18);

  drawProviderBadge(doc, provider, x, y + 20);
}

function drawProviderBadge(
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

function pdfProvider(modelId: string): PdfProvider {
  const id = modelId.toLowerCase();

  if (id.includes("openai") || id.includes("gpt")) {
    return { name: "OpenAI", color: "#10A37F" };
  }

  if (id.includes("anthropic") || id.includes("claude")) {
    return { name: "Claude", color: "#D97706" };
  }

  if (id.includes("google") || id.includes("gemini")) {
    return { name: "Gemini", color: "#4285F4" };
  }

  if (id.includes("deepseek")) {
    return { name: "DeepSeek", color: "#1D4ED8" };
  }

  if (id.includes("meta-llama") || id.includes("llama")) {
    return { name: "Llama", color: "#4F46E5" };
  }

  if (id.includes("mistral")) {
    return { name: "Mistral", color: "#EA580C" };
  }

  return {
    name: "AI",
    color: PDF.colors.providerFallback,
  };
}

function loadCircularAvatar(src: string, sizePx: number): Promise<string | null> {
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