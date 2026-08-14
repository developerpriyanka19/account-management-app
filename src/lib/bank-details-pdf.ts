import type { jsPDF } from "jspdf";
import type { BankDetailsSnapshot } from "@/lib/bank-details-types";
import { drawBankDetailsFromTop } from "@/lib/company-document-pdf-shared";
import { hasBankSnapshot } from "@/lib/bank-details-types";

const PDF_FONT = "times";

type DrawBankPdfOptions = {
  pdf: jsPDF;
  leftX: number;
  footerY: number;
  snapshot: BankDetailsSnapshot | null | undefined;
};

/** @deprecated Bank details render in the closing section on the last page only. */
export function drawBankDetailsPdf({
  pdf,
  leftX,
  footerY,
  snapshot,
}: DrawBankPdfOptions): void {
  if (!hasBankSnapshot(snapshot) || !snapshot) return;
  drawBankDetailsFromTop(pdf, leftX, footerY - 20, snapshot);
}

export { drawBankDetailsFromTop };
