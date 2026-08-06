import type { jsPDF } from "jspdf";
import { PDF } from "./pdfTheme";
import { divider, font, resetColor, textColor } from "./pdfUtils";

export const TEAMSTOA_URL = "https://www.teamstoa.com";

/** Baseline of the tagline line, so the export stamp can sit level with it. */
export function brandTaglineBaseline(y: number, markSize: number): number {
  return y + markSize - 12 + 10;
}

/** Draws the clickable TeamStoa brand lockup. */
function drawBrandLockup(doc: jsPDF, x: number, y: number, markSize: number, withTagline: boolean): void {
  const textX = x + markSize + 7;
  const baseline = y + markSize - (withTagline ? 12 : 5);

  font(doc, "bold", withTagline ? 12 : 8);
  textColor(doc, PDF.colors.participantName);
  doc.text("Team", textX, baseline);

  const teamWidth = doc.getTextWidth("Team");
  textColor(doc, PDF.colors.brand);
  doc.text("Stoa", textX + teamWidth, baseline);

  let width = teamWidth + doc.getTextWidth("Stoa");

  if (withTagline) {
    font(doc, "normal", 6);
    textColor(doc, PDF.colors.gray);
    doc.setCharSpace(1.1);
    doc.text("YOUR AI DECISION COUNCIL", textX, baseline + 10);
    width = Math.max(width, doc.getTextWidth("YOUR AI DECISION COUNCIL") + 24);
    doc.setCharSpace(0);
  }

  resetColor(doc);
  doc.link(x, y, markSize + 7 + width, markSize, { url: TEAMSTOA_URL });
}

export function drawPageHeader(
  doc: jsPDF,
  brandMarkDataUrl: string,
  title: string,
  compact: boolean,
  exportDate?: string
): number {
  const pageW = doc.internal.pageSize.getWidth();

  if (!compact) {
    const logoSize = 32;

    doc.addImage(brandMarkDataUrl, "PNG", PDF.marginX, 24, logoSize, logoSize);
    drawBrandLockup(doc, PDF.marginX, 24, logoSize, true);

    if (exportDate) {
      font(doc, "italic", PDF.fontSize.meta);
      textColor(doc, PDF.colors.gray);
      doc.text(`Exported ${exportDate}`, pageW - PDF.marginX, brandTaglineBaseline(24, logoSize), {
        align: "right",
      });
    }

    resetColor(doc);
    divider(doc, 64, PDF.colors.divider, 0.5);

    return 82;
  }

  const logoSize = 18;
  const textX = PDF.marginX + logoSize + 6;

  doc.addImage(brandMarkDataUrl, "PNG", PDF.marginX, 18, logoSize, logoSize);
  doc.link(PDF.marginX, 18, logoSize, logoSize, { url: TEAMSTOA_URL });

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