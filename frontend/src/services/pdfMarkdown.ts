import type { jsPDF } from "jspdf";

const MARGIN_X = 48;
const MARGIN_Y = 64;
const BLOCK_GAP = 8;

export function renderMarkdown(doc: jsPDF, markdown: string, startY: number): number {
  const width = doc.internal.pageSize.getWidth() - MARGIN_X * 2;
  let y = startY;
  for (const raw of markdown.split("\n")) {
    const line = raw.trim();
    if (!line) {
      y += BLOCK_GAP;
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = cleanInline(heading[2]);
      const size = level === 1 ? 20 : level === 2 ? 14 : 12;
      y = writeLines(doc, text, y, width, size, "bold", level === 1 ? 27 : 18);
      y += level === 1 ? 4 : 2;
      continue;
    }
    // Standalone bold line: **Section Title** — rendered as a bold sub-heading
    const boldLine = line.match(/^\*\*(.+)\*\*$/);
    if (boldLine) {
      y = writeLines(doc, boldLine[1], y, width, 12, "bold", 18);
      continue;
    }
    const italic = line.match(/^\*(?!\s)(.+)\*$/);
    if (italic) {
      y = writeLines(doc, cleanInline(italic[1]), y, width, 11, "italic", 16);
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      y = writeLines(doc, `• ${cleanInline(bullet[1])}`, y, width - 12, 11, "normal", 16, MARGIN_X + 12);
      continue;
    }
    const ordered = line.match(/^(\d+)\.\s+(.*)$/);
    if (ordered) {
      y = writeLines(doc, `${ordered[1]}. ${cleanInline(ordered[2])}`, y, width - 12, 11, "normal", 16, MARGIN_X + 12);
      continue;
    }
    y = writeLines(doc, cleanInline(line), y, width, 11, "normal", 16);
  }
  return y;
}

function writeLines(
  doc: jsPDF,
  text: string,
  y: number,
  width: number,
  size: number,
  style: "normal" | "bold" | "italic",
  lineHeight: number,
  x = MARGIN_X
): number {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text, width) as string[];
  for (const line of lines) {
    y = ensurePageSpace(doc, y, lineHeight);
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function ensurePageSpace(doc: jsPDF, y: number, needed: number): number {
  const maxY = doc.internal.pageSize.getHeight() - MARGIN_Y;
  if (y + needed <= maxY) {
    return y;
  }
  doc.addPage();
  return MARGIN_Y;
}

function cleanInline(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}
