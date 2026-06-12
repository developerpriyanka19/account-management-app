import type { jsPDF } from "jspdf";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";

const PDF_FONT = "times";

type DrawFooterOptions = {
  pdf: jsPDF;
  pageWidth: number;
  pageHeight: number;
  bottomMargin: number;
  contentWidth: number;
  pageNumber: number;
  pageCount: number;
};

/** Single-line centered footer at the bottom of a PDF page. */
export function drawCompanyDocumentFooterPdf({
  pdf,
  pageWidth,
  pageHeight,
  bottomMargin,
  contentWidth,
  pageNumber,
  pageCount,
}: DrawFooterOptions): void {
  const footerY = pageHeight - bottomMargin;
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(0, 0, 0);
  pdf.text(COMPANY_INVOICE_HEADER.footerAddress, pageWidth / 2, footerY - 2, {
    align: "center",
    maxWidth: contentWidth,
  });

  if (pageCount > 1) {
    pdf.setFontSize(5.5);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - bottomMargin, footerY, {
      align: "right",
    });
    pdf.setTextColor(0, 0, 0);
  }
}
