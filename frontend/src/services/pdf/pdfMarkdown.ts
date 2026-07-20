import type { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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

  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // GFM table block: a header row, a `|---|---|` separator, then data rows.
    // Detected before the line renderers because it spans multiple lines.
    const table = tryParseTable(lines, i);
    if (table) {
      y = renderTable(doc, table, y, headerFn);
      i = table.endIndex;
      continue;
    }

    if (!line) {
      y += PDF.gap.block;
      continue;
    }

    // Treat deeper and tightly-spaced model-generated headings as headings too,
    // so literal Markdown hashes never leak into the PDF.
    const heading = line.match(/^(#{1,})\s*(\S.*)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 3);
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

    // Models sometimes emit a literal bullet instead of Markdown `-` or `*`.
    const bullet = line.match(/^[-*\u2022]\s+(.*)$/);
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

/** Compact page-header bottom — must match `drawPageHeader(..., compact=true)`'s return in pdfHeader.ts. */
const COMPACT_HEADER_BOTTOM = 62;

type ParsedTable = { head: string[]; body: string[][]; endIndex: number };

/** Detects a GFM table starting at `lines[start]`; returns null if it isn't one. */
function tryParseTable(lines: string[], start: number): ParsedTable | null {
  const headerLine = lines[start];
  const separator = lines[start + 1];
  if (headerLine === undefined || separator === undefined) return null;
  if (!isTableRow(headerLine) || !isSeparatorRow(separator)) return null;

  const head = splitRow(headerLine);
  const body: string[][] = [];

  let i = start + 2;
  for (; i < lines.length; i++) {
    if (!isTableRow(lines[i])) break;
    const cells = splitRow(lines[i]);
    // Normalize ragged rows to the header's column count so autotable stays aligned.
    while (cells.length < head.length) cells.push("");
    body.push(cells.slice(0, head.length));
  }

  return { head, body, endIndex: i - 1 };
}

function isTableRow(line: string): boolean {
  return line.includes("|") && /\S/.test(line.replace(/\|/g, ""));
}

function isSeparatorRow(line: string): boolean {
  const t = line.trim();
  if (!t.includes("-") || !t.includes("|")) return false;
  const cells = t.replace(/^\|/, "").replace(/\|$/, "").split("|");
  return cells.length > 0 && cells.every((c) => /^\s*:?-+:?\s*$/.test(c));
}

function splitRow(line: string): string[] {
  const t = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return t.split("|").map((c) => cleanInline(c.trim()));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Renders a parsed table via jspdf-autotable, styled to the PDF theme, and returns the y below it. */
function renderTable(
  doc: jsPDF,
  table: ParsedTable,
  startY: number,
  headerFn?: PageHeaderFn
): number {
  autoTable(doc, {
    head: [table.head],
    body: table.body,
    startY: startY + 4,
    theme: "grid",
    margin: {
      left: PDF.marginX,
      right: PDF.marginX,
      top: headerFn ? COMPACT_HEADER_BOTTOM : PDF.marginY,
    },
    styles: {
      font: PDF.font,
      fontSize: 9,
      cellPadding: 4,
      textColor: hexToRgb(PDF.colors.text),
      lineColor: hexToRgb(PDF.colors.dividerStrong),
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: hexToRgb(PDF.colors.brand),
      textColor: hexToRgb(PDF.colors.white),
      fontStyle: "bold",
    },
    // Redraw the running page header on tables that span page breaks (pages after the first).
    didDrawPage: (data) => {
      if (headerFn && data.pageNumber > 1) headerFn(doc);
    },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
  return (finalY ?? startY) + PDF.gap.block;
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
  x: number = PDF.marginX,
  headerFn?: PageHeaderFn
): number {
  LINK_RE.lastIndex = 0;

  if (!LINK_RE.test(text)) {
    LINK_RE.lastIndex = 0;
    return writeLines(doc, cleanInline(text), y, width, size, style, lineHeight, x, headerFn);
  }

  LINK_RE.lastIndex = 0;

  type Segment = { content: string; url?: string };

  const segments: Segment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = LINK_RE.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ content: cleanInline(text.slice(last, match.index)) });
    }

    segments.push({
      content: cleanInline(match[1]),
      url: match[2],
    });

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ content: cleanInline(text.slice(last)) });
  }

  font(doc, style, size);

  let curX = x;

  for (const seg of segments) {
    for (const token of seg.content.split(/(\s+)/)) {
      if (!token) continue;

      const tokenWidth = doc.getTextWidth(token);

      if (/^\s+$/.test(token)) {
        if (curX + tokenWidth <= x + width) {
          curX += tokenWidth;
        }
        continue;
      }

      const fragments = splitTokenToFit(doc, token, width);

      fragments.forEach((fragment, fragmentIndex) => {
        const fragmentWidth = doc.getTextWidth(fragment);

        if (curX + fragmentWidth > x + width && curX > x) {
          y += lineHeight;
          curX = x;
        }

        y = ensurePageSpace(doc, y, lineHeight, headerFn);
        drawTextFragment(doc, fragment, curX, y, fragmentWidth, lineHeight, seg.url);
        curX += fragmentWidth;

        if (fragmentIndex < fragments.length - 1) {
          y += lineHeight;
          curX = x;
        }
      });
    }
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
  x: number = PDF.marginX,
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

    const fragments = splitTokenToFit(doc, word.text, width);

    fragments.forEach((fragment, fragmentIndex) => {
      const fragmentWidth = doc.getTextWidth(fragment);

      if (curX + fragmentWidth > x + width && curX > x) {
        y += lineHeight;
        curX = x;
      }

      y = ensurePageSpace(doc, y, lineHeight, headerFn);
      textColor(doc, PDF.colors.text);
      doc.text(fragment, curX, y);
      curX += fragmentWidth;

      if (fragmentIndex < fragments.length - 1) {
        y += lineHeight;
        curX = x;
      }
    });
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
  x: number = PDF.marginX,
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

function splitTokenToFit(doc: jsPDF, token: string, width: number): string[] {
  if (doc.getTextWidth(token) <= width) {
    return [token];
  }

  return doc.splitTextToSize(token, width) as string[];
}

function drawTextFragment(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  url?: string
): void {
  textColor(doc, url ? PDF.colors.link : PDF.colors.text);
  doc.text(text, x, y);

  if (!url) {
    return;
  }

  drawColor(doc, PDF.colors.link);
  doc.setLineWidth(0.4);
  doc.line(x, y + 1.2, x + width, y + 1.2);
  doc.link(x, y - lineHeight * 0.75, width, lineHeight, { url });
}

export function ensurePageSpace(
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
    .replace(/`([^`]+)`/g, "$1")
    // jsPDF's built-in Helvetica cannot reliably measure/render these glyphs.
    .replace(/\u00a0/g, " ")
    .replace(/[\u2192\u21d2\u2794\u279c\u27a1]/g, "->")
    .replace(/[\u2190\u21d0]/g, "<-")
    .replace(/[\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g, "");
}
