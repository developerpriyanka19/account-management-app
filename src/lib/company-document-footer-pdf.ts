import type { jsPDF } from "jspdf";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import { PDF_FONT, pdfFooterY } from "@/lib/company-document-pdf-shared";

type DrawFooterOptions = {
  pdf: jsPDF;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  pageNumber: number;
  pageCount: number;
};

/** Single-line centered footer at the bottom of a PDF page. */
export function drawCompanyDocumentFooterPdf({
  pdf,
  pageWidth,
  pageHeight,
  contentWidth,
  pageNumber,
  pageCount,
}: DrawFooterOptions): void {
  const footerY = pdfFooterY(pageHeight);
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(5.5);
  pdf.setTextColor(0, 0, 0);
  pdf.text(COMPANY_INVOICE_HEADER.footerAddress, pageWidth / 2, footerY, {
    align: "center",
    maxWidth: contentWidth,
  });

  if (pageCount > 1) {
    pdf.setFontSize(5);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - 10, footerY, {
      align: "right",
    });
    pdf.setTextColor(0, 0, 0);
  }
}
