import type { jsPDF } from "jspdf";
import { COMPANY_INVOICE_HEADER, INVOICE_LOGO_PDF_MM } from "@/lib/invoice-config";

const PDF_FONT = "times";

/** RGB for #f5821f */
const COMPANY_ORANGE: [number, number, number] = [245, 130, 31];
/** RGB for #111827 */
const TITLE_GRAY: [number, number, number] = [17, 24, 39];
/** RGB for #6ab04c */
const DIVIDER_GREEN: [number, number, number] = [106, 176, 76];

type DrawBrandHeaderOptions = {
  pdf: jsPDF;
  logoDataUrl: string;
  documentTitle: string;
  pageWidth: number;
  leftMargin: number;
  rightMargin: number;
  startY: number;
};

/**
 * Draw shared brand header: logo + company name, green rule, centered document title.
 * Returns Y position after header (including bottom margin).
 */
export function drawCompanyBrandHeaderPdf({
  pdf,
  logoDataUrl,
  documentTitle,
  pageWidth,
  leftMargin,
  rightMargin,
  startY,
}: DrawBrandHeaderOptions): number {
  const rightX = pageWidth - rightMargin;
  const contentW = rightX - leftMargin;
  const { logoHeight, gap, companyFontSize, titleFontSize, lineWidth, metadataMargin } =
    INVOICE_LOGO_PDF_MM;

  pdf.addImage(logoDataUrl, "PNG", leftMargin, startY, logoHeight, logoHeight);

  const textX = leftMargin + logoHeight + gap;
  pdf.setFont(PDF_FONT, "bold");
  pdf.setTextColor(...COMPANY_ORANGE);
  pdf.setFontSize(companyFontSize);
  pdf.text(COMPANY_INVOICE_HEADER.name, textX, startY + logoHeight * 0.62, {
    maxWidth: contentW - logoHeight - gap,
  });

  let y = startY + logoHeight + 2;
  pdf.setDrawColor(...DIVIDER_GREEN);
  pdf.setLineWidth(lineWidth);
  pdf.line(leftMargin, y, rightX, y);

  y += 4.5;
  pdf.setFont(PDF_FONT, "bold");
  pdf.setTextColor(...TITLE_GRAY);
  pdf.setFontSize(titleFontSize);
  pdf.text(documentTitle.toUpperCase(), pageWidth / 2, y, { align: "center" });

  pdf.setTextColor(0, 0, 0);
  return y + metadataMargin;
}
