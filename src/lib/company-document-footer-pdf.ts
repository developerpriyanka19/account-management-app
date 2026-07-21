import type { jsPDF } from "jspdf";
import { PDF_FONT, PDF_MARGIN, pdfFooterY } from "@/lib/company-document-pdf-shared";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";

/** RGB for #6ab04c */
const DIVIDER_GREEN: [number, number, number] = [106, 176, 76];

const FOOTER_FONT_SIZE = 9.5;
const FOOTER_LINE_HEIGHT = 3.6;

type DrawFooterOptions = {
  pdf: jsPDF;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  pageNumber: number;
  pageCount: number;
  /** When true, shows "Page X of Y" on multi-page documents. */
  showPageNumbers?: boolean;
};

/**
 * Green divider line + centered address footer (shared by all company PDFs).
 */
export function drawCompanyDocumentFooterPdf({
  pdf,
  pageWidth,
  pageHeight,
  contentWidth,
  pageNumber,
  pageCount,
  showPageNumbers = false,
}: DrawFooterOptions): void {
  const footerY = pdfFooterY(pageHeight);
  const leftX = PDF_MARGIN.left;
  const rightX = pageWidth - PDF_MARGIN.right;
  const lineY = footerY - 16;

  pdf.setDrawColor(...DIVIDER_GREEN);
  pdf.setLineWidth(0.35);
  pdf.line(leftX, lineY, rightX, lineY);

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(FOOTER_FONT_SIZE);
  pdf.setTextColor(0, 0, 0);

  const lines = [
    COMPANY_INVOICE_HEADER.footerAddress,
    `GST No : ${COMPANY_INVOICE_HEADER.gstin}`,
    COMPANY_INVOICE_HEADER.phone,
    COMPANY_INVOICE_HEADER.email,
  ];

  let textY = lineY + 5.5;
  for (const line of lines) {
    pdf.text(line, pageWidth / 2, textY, {
      align: "center",
      maxWidth: contentWidth,
    });
    textY += FOOTER_LINE_HEIGHT;
  }

  if (showPageNumbers && pageCount > 1) {
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - PDF_MARGIN.right, footerY, {
      align: "right",
    });
    pdf.setTextColor(0, 0, 0);
  }
}
