import type { jsPDF } from "jspdf";
import { PDF } from "./pdfTheme";
import { divider, font, resetColor, textColor } from "./pdfUtils";

export function drawPageHeader(
  doc: jsPDF,
  logoDataUrl: string,
  title: string,
  compact: boolean,
  exportDate?: string
): number {
  const pageW = doc.internal.pageSize.getWidth();

  if (!compact) {
    const logoSize = 32;

    doc.addImage(logoDataUrl, "PNG", PDF.marginX, 24, logoSize, logoSize);

    font(doc, "bold", 9);
    textColor(doc, PDF.colors.brand);
    doc.text("TeamStoa", PDF.marginX + logoSize + 7, 45);

    if (exportDate) {
      font(doc, "italic", PDF.fontSize.meta);
      textColor(doc, PDF.colors.gray);
      doc.text(`Exported ${exportDate}`, pageW - PDF.marginX, 45, { align: "right" });
    }

    resetColor(doc);
    divider(doc, 64, PDF.colors.divider, 0.5);

    return 82;
  }

  const logoSize = 18;
  const textX = PDF.marginX + logoSize + 6;

  doc.addImage(logoDataUrl, "PNG", PDF.marginX, 18, logoSize, logoSize);

  font(doc, "bold", 8);
  textColor(doc, PDF.colors.brand);

  const fittedTitle = doc.splitTextToSize(title, pageW - PDF.marginX - textX)[0] ?? title;
  doc.text(fittedTitle, textX, 30);

  resetColor(doc);
  divider(doc, 42, PDF.colors.divider, 0.4);

  return 62;
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
    textColor(doc, PDF.colors.gray);

    doc.text(`${p} / ${totalPages}`, pageW - PDF.marginX, pageH - 20, {
      align: "right",
    });
  }

  resetColor(doc);
}