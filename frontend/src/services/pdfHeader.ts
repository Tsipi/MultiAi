import type { jsPDF } from "jspdf";
import { PDF } from "./pdfTheme";
import { divider, font, resetColor, textColor } from "./pdfUtils";

export function drawPageHeader(
  doc: jsPDF,
  logoDataUrl: string,
  title: string,
  compact: boolean
): number {
  const pageW = doc.internal.pageSize.getWidth();

  if (!compact) {
    const logoSize = 32;

    doc.addImage(logoDataUrl, "PNG", PDF.marginX, 14, logoSize, logoSize);

    font(doc, "bold", 9);
    textColor(doc, PDF.colors.brand);
    doc.text("MultiAi Consensus", PDF.marginX + logoSize + 7, 35);

    resetColor(doc);
    divider(doc, 54, PDF.colors.divider, 0.5);

    return 72;
  }

  const logoSize = 18;
  const textX = PDF.marginX + logoSize + 6;

  doc.addImage(logoDataUrl, "PNG", PDF.marginX, 12, logoSize, logoSize);

  font(doc, "bold", 8);
  textColor(doc, PDF.colors.brand);

  const fittedTitle = doc.splitTextToSize(title, pageW - PDF.marginX - textX)[0] ?? title;
  doc.text(fittedTitle, textX, 24);

  resetColor(doc);
  divider(doc, 36, PDF.colors.divider, 0.4);

  return 56;
}

export function drawWatermarks(
  doc: jsPDF,
  watermarkDataUrl: string,
  totalPages: number
): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const size = Math.min(pageW, pageH) * 0.4;
  const x = (pageW - size) / 2;
  const y = (pageH - size) / 2;

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.addImage(watermarkDataUrl, "PNG", x, y, size, size);
  }
}

export function drawPageNumbers(doc: jsPDF, totalPages: number): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    font(doc, "normal", PDF.fontSize.pageNumber);
    textColor(doc, PDF.colors.soft);

    doc.text(`${p} / ${totalPages}`, pageW - PDF.marginX, pageH - 20, {
      align: "right",
    });
  }

  resetColor(doc);
}