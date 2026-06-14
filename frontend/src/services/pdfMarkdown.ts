import type { jsPDF } from "jspdf";
import { PDF } from "./pdfTheme";
import {
  contentWidth,
  divider,
  font,
  pageBottom,
  resetColor,
  textColor,
  drawColor,
  type FontStyle,
} from "./pdfUtils";

/** Called when a new page is started; draws the page header and returns the y to resume content at. */
export type PageHeaderFn = (doc: jsPDF) => number;

export function renderMarkdown(
  doc: jsPDF,
  markdown: string,
  startY: number,
  headerFn?: PageHeaderFn
): number {
  const width = contentWidth(doc);
  let y = startY;

  for (const raw of markdown.split("\n")) {
    const line = raw.trim();

    if (!line) {
      y += PDF.gap.block;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = cleanInline(heading[2]);

      const size =
        level === 1
          ? PDF.fontSize.h1
          : level === 2
            ? PDF.fontSize.h2
            : PDF.fontSize.h3;

      const lineHeight =
        level === 1
          ? PDF.lineHeight.h1
          : PDF.lineHeight.heading;

      y = writeLines(doc, text, y, width, size, "bold", lineHeight, PDF.marginX, headerFn);
      y += level === 1 ? 4 : 2;
      continue;
    }

    // Horizontal rule: `---`, `***`, or `___` on its own line
    if (line === "---" || line === "***" || line === "___") {
      y = ensurePageSpace(doc, y, 12, headerFn);
      y += 4;
      divider(doc, y);
      y += 8;
      continue;
    }

    // Standalone bold line: **Section Title** — rendered as a bold sub-heading
    const boldLine = line.match(/^\*\*(.+)\*\*$/);
    if (boldLine) {
      y = writeLines(
        doc,
        cleanInline(boldLine[1]),
        y,
        width,
        PDF.fontSize.h3,
        "bold",
        PDF.lineHeight.heading,
        PDF.marginX,
        headerFn
      );
      continue;
    }

    const italic = line.match(/^\*(?!\s)(.+)\*$/);
    if (italic) {
      y = writeLines(
        doc,
        cleanInline(italic[1]),
        y,
        width,
        PDF.fontSize.body,
        "italic",
        PDF.lineHeight.body,
        PDF.marginX,
        headerFn
      );
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      y = writeLineWithLinks(
        doc,
        `• ${bullet[1]}`,
        y,
        width - 12,
        PDF.fontSize.body,
        "normal",
        PDF.lineHeight.body,
        PDF.marginX + 12,
        headerFn
      );
      continue;
    }

    const ordered = line.match(/^(\d+)\.\s+(.*)$/);
    if (ordered) {
      y = writeLineWithLinks(
        doc,
        `${ordered[1]}. ${ordered[2]}`,
        y,
        width - 12,
        PDF.fontSize.body,
        "normal",
        PDF.lineHeight.body,
        PDF.marginX + 12,
        headerFn
      );
      continue;
    }

    y = writeLineWithInlineBold(
      doc,
      line,
      y,
      width,
      PDF.fontSize.body,
      PDF.lineHeight.body,
      PDF.marginX,
      headerFn
    );
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
  style: FontStyle,
  lineHeight: number,
  x = PDF.marginX,
  headerFn?: PageHeaderFn
): number {
  LINK_RE.lastIndex = 0;

  if (!LINK_RE.test(text)) {
    LINK_RE.lastIndex = 0;
    return writeLines(doc, cleanInline(text), y, width, size, style, lineHeight, x, headerFn);
  }

  LINK_RE.lastIndex = 0;

  type Segment =
    | { kind: "text"; content: string }
    | { kind: "link"; label: string; url: string };

  const segments: Segment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ kind: "text", content: text.slice(last, match.index) });
    }

    segments.push({
      kind: "link",
      label: match[1],
      url: match[2],
    });

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ kind: "text", content: text.slice(last) });
  }

  y = ensurePageSpace(doc, y, lineHeight, headerFn);
  font(doc, style, size);

  let curX = x;

  for (const seg of segments) {
    if (seg.kind === "text") {
      const cleaned = cleanInline(seg.content);
      if (!cleaned) continue;

      textColor(doc, PDF.colors.text);
      doc.text(cleaned, curX, y);
      curX += doc.getTextWidth(cleaned);
      continue;
    }

    textColor(doc, PDF.colors.link);
    doc.text(seg.label, curX, y);

    const linkWidth = doc.getTextWidth(seg.label);

    drawColor(doc, PDF.colors.link);
    doc.setLineWidth(0.4);
    doc.line(curX, y + 1.2, curX + linkWidth, y + 1.2);

    doc.link(curX, y - lineHeight * 0.75, linkWidth, lineHeight, {
      url: seg.url,
    });

    curX += linkWidth;
  }

  resetColor(doc);
  return y + lineHeight;
}

/**
 * Renders a paragraph line, alternating "normal" and "bold" font weight for
 * `**bold**` segments while word-wrapping across `width`.
 *
 * Lines containing markdown links fall back to `writeLineWithLinks`,
 * which strips bold markers.
 */
function writeLineWithInlineBold(
  doc: jsPDF,
  text: string,
  y: number,
  width: number,
  size: number,
  lineHeight: number,
  x = PDF.marginX,
  headerFn?: PageHeaderFn
): number {
  LINK_RE.lastIndex = 0;

  if (LINK_RE.test(text)) {
    LINK_RE.lastIndex = 0;
    return writeLineWithLinks(doc, text, y, width, size, "normal", lineHeight, x, headerFn);
  }

  LINK_RE.lastIndex = 0;

  type Word = {
    text: string;
    bold: boolean;
  };

  const words: Word[] = [];

  for (const part of text.split(/(\*\*[^*]+\*\*)/g)) {
    if (!part) continue;

    const match = part.match(/^\*\*([^*]+)\*\*$/);
    const content = cleanInline(match ? match[1] : part);

    for (const token of content.split(/(\s+)/)) {
      if (token) {
        words.push({
          text: token,
          bold: Boolean(match),
        });
      }
    }
  }

  y = ensurePageSpace(doc, y, lineHeight, headerFn);

  let curX = x;

  for (const word of words) {
    font(doc, word.bold ? "bold" : "normal", size);

    const wordWidth = doc.getTextWidth(word.text);

    if (/^\s+$/.test(word.text)) {
      if (curX + wordWidth <= x + width) {
        curX += wordWidth;
      }
      continue;
    }

    if (curX + wordWidth > x + width && curX > x) {
      y += lineHeight;
      y = ensurePageSpace(doc, y, lineHeight, headerFn);
      curX = x;
    }

    textColor(doc, PDF.colors.text);
    doc.text(word.text, curX, y);
    curX += wordWidth;
  }

  resetColor(doc);
  return y + lineHeight;
}

function writeLines(
  doc: jsPDF,
  text: string,
  y: number,
  width: number,
  size: number,
  style: FontStyle,
  lineHeight: number,
  x = PDF.marginX,
  headerFn?: PageHeaderFn
): number {
  font(doc, style, size);
  textColor(doc, PDF.colors.text);

  const lines = doc.splitTextToSize(text, width) as string[];

  for (const line of lines) {
    y = ensurePageSpace(doc, y, lineHeight, headerFn);
    doc.text(line, x, y);
    y += lineHeight;
  }

  resetColor(doc);
  return y;
}

function ensurePageSpace(
  doc: jsPDF,
  y: number,
  needed: number,
  headerFn?: PageHeaderFn
): number {
  if (y + needed <= pageBottom(doc)) {
    return y;
  }

  doc.addPage();
  return headerFn ? headerFn(doc) : PDF.marginY;
}

function cleanInline(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}