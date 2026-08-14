"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toDisplayDate } from "@/lib/date-format";
import { formatReportMoney } from "@/lib/reports-formulas";
import { PDF_FONT, PDF_MARGIN, pdfContentWidth } from "@/lib/company-document-pdf-shared";
import { openPdfBlobInNewTab } from "@/lib/pdf-print";

type IndividualFarmerPrintData = {
  farmer: {
    id: number;
    farmerName: string;
    changedFarmerName: string;
    vendorCode: string;
    surveyNo: string;
    newSurveyNo: string;
    state: string;
    district: string;
    taluk: string;
    hobbli: string;
    village: string;
    rtcExtentAcre: number | null;
    rtcExtentGunta: number | null;
    leaseExtentAcre: number | null;
    leaseExtentGunta: number | null;
  };
  paymentSummary: { total: number };
  govtFeeSummary: { total: number };
  invoices: Array<{ invoiceNumber: string; invoiceDate: string; total: number; status: string }>;
  debitNotes: Array<{ debitNoteNo: string; date: string; total: number; type: string }>;
};

export async function printIndividualFarmerReportPdf(data: IndividualFarmerPrintData) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const contentW = pdfContentWidth(pageW);
  const f = data.farmer;
  let y = PDF_MARGIN.top;

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(14);
  pdf.text("Individual Farmer Report", pageW / 2, y, { align: "center" });
  y += 8;

  pdf.setFontSize(10);
  pdf.text(f.farmerName || "—", PDF_MARGIN.left, y);
  y += 6;
  pdf.setFont(PDF_FONT, "normal");
  pdf.setFontSize(9);

  const meta = [
    ["Changed Name", f.changedFarmerName || "—"],
    ["Vendor", f.vendorCode || "—"],
    ["Survey / New Survey", `${f.surveyNo || "—"} / ${f.newSurveyNo || "—"}`],
    [
      "Location",
      [f.state, f.district, f.taluk, f.hobbli, f.village].filter(Boolean).join(", ") || "—",
    ],
    [
      "RTC Extent",
      `${f.rtcExtentAcre ?? "—"} Acres / ${f.rtcExtentGunta ?? "—"} Guntas`,
    ],
    [
      "Lease Extent",
      `${f.leaseExtentAcre ?? "—"} Acres / ${f.leaseExtentGunta ?? "—"} Guntas`,
    ],
    ["Payment Total", formatReportMoney(data.paymentSummary.total)],
    ["Govt Fee Total", formatReportMoney(data.govtFeeSummary.total)],
  ];

  autoTable(pdf, {
    startY: y,
    margin: { left: PDF_MARGIN.left, right: PDF_MARGIN.right },
    tableWidth: contentW,
    body: meta,
    theme: "grid",
    styles: { font: PDF_FONT, fontSize: 9, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold" },
      1: { cellWidth: contentW - 40 },
    },
  });

  y = ((pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;

  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(10);
  pdf.text("Invoices", PDF_MARGIN.left, y);
  y += 2;

  autoTable(pdf, {
    startY: y,
    margin: { left: PDF_MARGIN.left, right: PDF_MARGIN.right },
    tableWidth: contentW,
    head: [["Invoice No", "Date", "Status", "Amount"]],
    body:
      data.invoices.length > 0
        ? data.invoices.map((inv) => [
            inv.invoiceNumber,
            toDisplayDate(inv.invoiceDate) || inv.invoiceDate,
            inv.status,
            formatReportMoney(inv.total),
          ])
        : [["—", "—", "—", "—"]],
    theme: "grid",
    styles: { font: PDF_FONT, fontSize: 8, cellPadding: 1.2 },
    headStyles: { fontStyle: "bold", fillColor: [245, 245, 245], textColor: [0, 0, 0] },
  });

  y = ((pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 6;
  pdf.setFont(PDF_FONT, "bold");
  pdf.setFontSize(10);
  pdf.text("Debit Notes", PDF_MARGIN.left, y);
  y += 2;

  autoTable(pdf, {
    startY: y,
    margin: { left: PDF_MARGIN.left, right: PDF_MARGIN.right },
    tableWidth: contentW,
    head: [["Debit Note No", "Date", "Type", "Amount"]],
    body:
      data.debitNotes.length > 0
        ? data.debitNotes.map((dn) => [
            dn.debitNoteNo,
            toDisplayDate(dn.date) || dn.date,
            dn.type,
            formatReportMoney(dn.total),
          ])
        : [["—", "—", "—", "—"]],
    theme: "grid",
    styles: { font: PDF_FONT, fontSize: 8, cellPadding: 1.2 },
    headStyles: { fontStyle: "bold", fillColor: [245, 245, 245], textColor: [0, 0, 0] },
  });

  const blob = pdf.output("blob");
  openPdfBlobInNewTab(blob, `individual-farmer-${f.id}.pdf`);
}
