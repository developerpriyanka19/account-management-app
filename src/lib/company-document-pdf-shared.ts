import type { jsPDF } from "jspdf";
import type { BankDetailsSnapshot } from "@/lib/bank-details-types";
import { hasBankSnapshot } from "@/lib/bank-details-types";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";

export const PDF_FONT = "times";

export const PDF_A4_PORTRAIT = { width: 210, height: 297 } as const;
export const PDF_A4_LANDSCAPE = { width: 297, height: 210 } as const;

/** Standard A4 margins (mm). */
export const PDF_MARGIN = {
  top: 10,
  left: 10,
  right: 10,
  bottom: 12,
  /** Reserved space above bottom margin for green line + address + contact footer. */
  footerReserve: 26,
} as const;

/** Gap before signature block after last content line. */
export const PDF_SIGNATURE_GAP = 6;
/** Height of the signatory text block. */
export const PDF_SIGNATURE_HEIGHT = 11;
/** Approximate height of bank details when shown beside signature. */
export const PDF_BANK_BLOCK_HEIGHT = 20;

/** Bottom margin for autoTable page breaks — footer only (no signature reserve). */
export const PDF_TABLE_BOTTOM_MARGIN = 14;

export function pdfContentWidth(pageWidth: number): number {
  return pageWidth - PDF_MARGIN.left - PDF_MARGIN.right;
}

export function pdfFooterY(pageHeight: number): number {
  return pageHeight - PDF_MARGIN.bottom;
}

/** Maximum Y for flowing content before the footer address line. */
export function pdfContentBottomLimit(pageHeight: number): number {
  return pageHeight - PDF_MARGIN.bottom - PDF_MARGIN.footerReserve - 1;
}

/** Height needed for bank (if any) + signature on the last page. */
export function closingBlockHeight(bank?: BankDetailsSnapshot | null): number {
  const bankH = hasBankSnapshot(bank) ? PDF_BANK_BLOCK_HEIGHT : 0;
  return PDF_SIGNATURE_GAP + Math.max(PDF_SIGNATURE_HEIGHT, bankH) + 2;
}

/**
 * Start a new page when [currentY, currentY + blockHeight] would cross the printable limit.
 * Returns the Y to continue drawing at (top of new page or unchanged currentY).
 */
export function ensureVerticalSpace(pdf: jsPDF, currentY: number, blockHeight: number): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const limit = pdfContentBottomLimit(pageHeight);
  if (currentY + blockHeight > limit) {
    pdf.addPage();
    return PDF_MARGIN.top;
  }
  return currentY;
}

/**
 * Draw bank details (left) and authorized signatory (right) immediately after content.
 * Call only once on the final page.
 */
export function drawClosingSection(
  pdf: jsPDF,
  pageWidth: number,
  contentEndY: number,
  bank?: BankDetailsSnapshot | null,
): number {
  const blockH = closingBlockHeight(bank);
  const y = ensureVerticalSpace(pdf, contentEndY, blockH);
  const blockTop = y + PDF_SIGNATURE_GAP;
  const rightX = pageWidth - PDF_MARGIN.right;

  if (hasBankSnapshot(bank) && bank) {
    drawBankDetailsFromTop(pdf, PDF_MARGIN.left, blockTop, bank);
  }

  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(8);
  pdf.text(`For ${COMPANY_INVOICE_HEADER.signatureName}`, rightX, blockTop, { align: "right" });
  pdf.setFontSize(7);
  pdf.text("Authorized Signatory", rightX, blockTop + 5, { align: "right" });

  return blockTop + Math.max(PDF_SIGNATURE_HEIGHT, hasBankSnapshot(bank) ? PDF_BANK_BLOCK_HEIGHT : 0);
}

/** Draw centered address footer on every page (no signature, no bank). */
export function drawFootersOnAllPages(
  pdf: jsPDF,
  drawFooter: (pageNumber: number, pageCount: number) => void,
): void {
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    drawFooter(page, pageCount);
  }
}

/** Bank block drawn top-down for flow layout beside signature. */
export function drawBankDetailsFromTop(
  pdf: jsPDF,
  leftX: number,
  startY: number,
  snapshot: BankDetailsSnapshot,
): number {
  const lineH = 3.2;
  let y = startY;

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(7);
  pdf.text("Account Details:", leftX, y);
  y += lineH;

  const rows: { label: string; value: string }[] = [
    { label: "Bank Name:", value: snapshot.bankName },
    { label: "Name:", value: snapshot.accountHolderName },
    { label: "Account No:", value: snapshot.accountNumber },
    { label: "IFSC:", value: snapshot.ifscCode },
  ];
  if (snapshot.branchName?.trim()) {
    rows.push({ label: "Branch:", value: snapshot.branchName.trim() });
  }

  for (const row of rows) {
    pdf.setFont(PDF_FONT, "bold");
    pdf.text(row.label, leftX, y);
    const labelW = pdf.getTextWidth(`${row.label} `);
    pdf.setFont(PDF_FONT, "normal");
    pdf.text(row.value, leftX + labelW, y);
    y += lineH;
  }

  return y;
}
