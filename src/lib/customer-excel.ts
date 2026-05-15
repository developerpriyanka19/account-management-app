import * as XLSX from "xlsx";
import type { CustomerListRow } from "@/lib/customer-list-format";
import {
  EXPORT_GROUPS,
  LEAF_COLUMN_IDS,
  getExportCellValue,
} from "@/lib/customer-table-columns";

const MONEY_LEAF_IDS = new Set([
  "totalGunta",
  "totalCents",
  "rentPerAcre",
  "aesAdvanceChequeAmount",
  "balanceRentAmount",
  "loanAmount",
  "rentAmount",
  "tdsAmount",
  "shortageChequeAmount",
  "atlStampDuty",
  "atlRegCharges",
  "atlTotal",
  "paoStampDuty",
  "paoRegCharges",
  "paoTotal",
  "landConversion",
  "podiFee",
  "leaseDeedStampDuty",
  "leaseDeedRegCharges",
  "debitNoteAmount",
  "receivedNeftAmount",
  "balanceReceivable",
  "cropCompensation",
  "rtcExtentAcre",
  "rtcExtentGunta",
  "rtcAKharab",
  "rtcBKharab",
  "balanceExtentAcre",
  "balanceExtentGunta",
  "leaseExtentAcre",
  "leaseExtentGunta",
]);

function columnWidth(values: (string | number)[]): number {
  const max = Math.max(...values.map((v) => String(v).length), 8);
  return Math.min(Math.max(max + 3, 10), 50);
}

export function exportCustomersToExcel(rows: CustomerListRow[], filename?: string) {
  const groupRow: string[] = [];
  const leafRow: string[] = [];

  for (const g of EXPORT_GROUPS) {
    groupRow.push(g.label);
    for (let i = 1; i < g.leafLabels.length; i++) groupRow.push("");
    leafRow.push(...g.leafLabels);
  }

  const body = rows.map((row) =>
    LEAF_COLUMN_IDS.map((id) => getExportCellValue(row, id)),
  );

  const aoa: (string | number)[][] = [groupRow, leafRow, ...body];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const merges: XLSX.Range[] = [];
  let col = 0;
  for (const g of EXPORT_GROUPS) {
    const span = g.leafLabels.length;
    if (span > 1) {
      merges.push({
        s: { r: 0, c: col },
        e: { r: 0, c: col + span - 1 },
      });
    }
    col += span;
  }
  ws["!merges"] = merges;

  ws["!cols"] = leafRow.map((label, colIndex) => ({
    wch: columnWidth([label, ...body.map((r) => r[colIndex])]),
  }));

  ws["!rows"] = [
    { hpt: 28 },
    { hpt: 22 },
    ...body.map(() => ({ hpt: 18 })),
  ];

  const lastRow = aoa.length - 1;
  const lastCol = leafRow.length - 1;
  const range = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: lastRow, c: lastCol },
  });

  ws["!autofilter"] = { ref: range };

  ws["!freeze"] = {
    xSplit: 0,
    ySplit: 2,
    topLeftCell: "A3",
    activePane: "bottomLeft",
    state: "frozen",
  };

  for (let c = 0; c <= lastCol; c++) {
    const leafId = LEAF_COLUMN_IDS[c];
    for (let r = 2; r <= lastRow; r++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell || typeof cell.v !== "number") continue;
      if (!MONEY_LEAF_IDS.has(leafId)) continue;
      cell.t = "n";
      cell.z = "#,##0.00";
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, filename ?? `customers-${stamp}.xlsx`);
}
