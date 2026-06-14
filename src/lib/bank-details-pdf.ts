import type { jsPDF } from "jspdf";
import type { BankDetailsSnapshot } from "@/lib/bank-details-types";
import { hasBankSnapshot } from "@/lib/bank-details-types";

const PDF_FONT = "times";

type DrawBankPdfOptions = {
  pdf: jsPDF;
  leftX: number;
  footerY: number;
  snapshot: BankDetailsSnapshot | null | undefined;
};

/** Account details block bottom-left above footer address. */
export function drawBankDetailsPdf({
  pdf,
  leftX,
  footerY,
  snapshot,
}: DrawBankPdfOptions): void {
  if (!hasBankSnapshot(snapshot) || !snapshot) return;

  const lineH = 3.2;
  let y = footerY - 17;

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
}
