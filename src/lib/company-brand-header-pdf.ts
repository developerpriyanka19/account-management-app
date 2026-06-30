import type { jsPDF } from "jspdf";
import {
  COMPANY_INVOICE_HEADER,
  INVOICE_LOGO_PDF_MM,
  invoiceLogoHeightMm,
} from "@/lib/invoice-config";
import { PDF_FONT } from "@/lib/company-document-pdf-shared";

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
 * [Logo]   APOORVA ENERGY SOLUTIONS (centered in remaining header width)
 * ───────────── green line ─────────────
 *              DOCUMENT TITLE
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
  const { logoWidth, gap, companyFontSize, titleFontSize, lineWidth, metadataMargin } =
    INVOICE_LOGO_PDF_MM;

  const logoHeight = invoiceLogoHeightMm(logoWidth);
  pdf.addImage(logoDataUrl, "PNG", leftMargin, startY, logoWidth, logoHeight);

  const nameAreaLeft = leftMargin + logoWidth + gap;
  const nameAreaWidth = rightX - nameAreaLeft;
  const nameCenterX = nameAreaLeft + nameAreaWidth / 2;
  const headerBlockHeight = Math.max(logoHeight, INVOICE_LOGO_PDF_MM.headerRowHeight);
  const logoCenterY = startY + logoHeight / 2;

  pdf.setFont(PDF_FONT, "bold");
  pdf.setTextColor(...COMPANY_ORANGE);
  pdf.setFontSize(companyFontSize);
  pdf.text(COMPANY_INVOICE_HEADER.name, nameCenterX, logoCenterY + companyFontSize * 0.1, {
    align: "center",
    maxWidth: nameAreaWidth,
  });

  let y = startY + headerBlockHeight + 1.5;
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
