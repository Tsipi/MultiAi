import type { jsPDF } from "jspdf";
import { PDF } from "./pdfTheme";

export type FontStyle = "normal" | "bold" | "italic";

export function font(doc: jsPDF, style: FontStyle, size: number): void {
  doc.setFont(PDF.font, style);
  doc.setFontSize(size);
}

export function textColor(doc: jsPDF, color: string = PDF.colors.text): void {
  doc.setTextColor(color);
}

export function drawColor(doc: jsPDF, color: string = PDF.colors.text): void {
  doc.setDrawColor(color);
}

export function fillColor(doc: jsPDF, color: string): void {
  doc.setFillColor(color);
}

export function resetColor(doc: jsPDF): void {
  doc.setTextColor(PDF.colors.text);
  doc.setDrawColor(PDF.colors.text);
}

/** Draws a small bold brand-violet section label (e.g. "Team Members", "Role", "Prompt"). */
export function drawSectionLabel(doc: jsPDF, text: string, y: number, xOffset = 0): number {
  font(doc, "bold", PDF.fontSize.h2);
  textColor(doc, PDF.colors.brand);
  doc.text(text, PDF.marginX + xOffset, y);
  resetColor(doc);

  return y + 14;
}

export function contentWidth(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth() - PDF.marginX * 2;
}

export function pageBottom(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight() - PDF.marginY;
}

export function divider(
  doc: jsPDF,
  y: number,
  color: string = PDF.colors.divider,
  width = 0.4
): void {
  const pageW = doc.internal.pageSize.getWidth();

  drawColor(doc);
  doc.setLineWidth(width);
  doc.line(PDF.marginX, y, pageW - PDF.marginX, y);
}