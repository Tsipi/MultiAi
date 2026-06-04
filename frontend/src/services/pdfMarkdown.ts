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
      y = writeLineWithLinks(doc, `• ${bullet[1]}`, y, width - 12, 11, "normal", 16, MARGIN_X + 12);
      continue;
    }
    const ordered = line.match(/^(\d+)\.\s+(.*)$/);
    if (ordered) {
      y = writeLineWithLinks(doc, `${ordered[1]}. ${ordered[2]}`, y, width - 12, 11, "normal", 16, MARGIN_X + 12);
      continue;
    }
    y = writeLineWithLinks(doc, line, y, width, 11, "normal", 16);
  }
  return y;
}

const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Renders a line of text, turning markdown links into blue underlined clickable text. */
function writeLineWithLinks(
  doc: jsPDF,
  text: string,
  y: number,
  width: number,
  size: number,
  style: "normal" | "bold" | "italic",
  lineHeight: number,
  x = MARGIN_X
): number {
  LINK_RE.lastIndex = 0;
  if (!LINK_RE.test(text)) {
    LINK_RE.lastIndex = 0;
    return writeLines(doc, cleanInline(text), y, width, size, style, lineHeight, x);
  }
  LINK_RE.lastIndex = 0;

  // Split line into plain-text and link segments
  type Seg = { kind: "text"; content: string } | { kind: "link"; label: string; url: string };
  const segments: Seg[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = LINK_RE.exec(text)) !== null) {
    if (m.index > last) segments.push({ kind: "text", content: text.slice(last, m.index) });
    segments.push({ kind: "link", label: m[1], url: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ kind: "text", content: text.slice(last) });

  y = ensurePageSpace(doc, y, lineHeight);
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  let curX = x;

  for (const seg of segments) {
    if (seg.kind === "text") {
      const cleaned = cleanInline(seg.content);
      if (!cleaned) continue;
      doc.setTextColor(0, 0, 0);
      doc.text(cleaned, curX, y);
      curX += doc.getTextWidth(cleaned);
    } else {
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text(seg.label, curX, y);
      const lw = doc.getTextWidth(seg.label);
      // Underline
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.4);
      doc.line(curX, y + 1.2, curX + lw, y + 1.2);
      // Clickable annotation
      doc.link(curX, y - lineHeight * 0.75, lw, lineHeight, { url: seg.url });
      curX += lw;
    }
  }

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  return y + lineHeight;
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
