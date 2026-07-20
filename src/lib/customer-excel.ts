import * as XLSX from "xlsx-js-style";
import type { CustomerListRow } from "@/lib/customer-list-format";
import {
  EXPORT_GROUPS,
  EXPORT_LEAF_COLUMN_IDS,
  getExportCellValue,
  type LeafColumnId,
} from "@/lib/customer-table-columns";

const MONEY_LEAF_IDS = new Set([
  "totalGunta",
  "totalCents",
  "rentPerAcre",
  "rentAmount",
  "aesAdvanceChequeAmount",
  "balanceRentAmount",
  "loanAmount",
  "leaseAmount",
  "tdsAmount",
  "shortageChequeAmount",
  "shortageAmountSecondTime",
  "shortageThirdChequeAmount",
  "shortageAmountTotal",
  "rentalDdPart1Amount",
  "atlTotal",
  "paoTotal",
  "landConversion",
  "otherRecoveries",
  "podiFee",
  "leaseDeedGovtFee",
  "totalGovtFee",
  "debitNoteAmount",
  "otherCharges",
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

  const LEFT_ALIGN_LEAF_IDS = new Set<LeafColumnId>([
  "farmerName",
  "changedFarmerName",
  "vendorCode",
  "surveyNo",
  "newSurveyNo",
  "remark",
  "state",
  "district",
  "taluk",
  "hobbli",
  "village",
]);

const BORDER_COLOR = "D1D5DB";
const HEADER_BG = "F8FAFC";
const HEADER_FONT = "111827";
const RED_HEADER_FONT = "DC2626";

type CellStyle = XLSX.CellObject["s"];

function thinBorder(): CellStyle["border"] {
  const edge = { style: "thin" as const, color: { rgb: BORDER_COLOR } };
  return { top: edge, bottom: edge, left: edge, right: edge };
}

function baseStyle(opts?: {
  bold?: boolean;
  color?: string;
  fill?: string;
  horizontal?: "left" | "center" | "right";
  wrap?: boolean;
}): CellStyle {
  return {
    font: {
      bold: opts?.bold ?? false,
      sz: 11,
      color: { rgb: opts?.color ?? HEADER_FONT },
    },
    alignment: {
      horizontal: opts?.horizontal ?? "center",
      vertical: "center",
      wrapText: opts?.wrap ?? true,
    },
    fill: opts?.fill ? { fgColor: { rgb: opts.fill } } : undefined,
    border: thinBorder(),
  };
}

function columnWidth(values: (string | number)[]): number {
  const max = Math.max(...values.map((v) => String(v).length), 8);
  return Math.min(Math.max(max + 3, 10), 50);
}

/** Map each export column index to its parent group (for row-0 header styling). */
function buildGroupHeaderByColumn(): Map<number, { label: string; headerTone?: "red" }> {
  const map = new Map<number, { label: string; headerTone?: "red" }>();
  let col = 0;
  for (const g of EXPORT_GROUPS) {
    for (let i = 0; i < g.leafLabels.length; i++) {
      map.set(col + i, { label: g.label, headerTone: g.headerTone });
    }
    col += g.leafLabels.length;
  }
  return map;
}

function ensureWorksheetCells(
  ws: XLSX.WorkSheet,
  lastRow: number,
  lastCol: number,
): void {
  for (let r = 0; r <= lastRow; r++) {
    for (let c = 0; c <= lastCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) {
        ws[addr] = { t: "s", v: "" };
      }
    }
  }
}

function applyWorksheetStyles(
  ws: XLSX.WorkSheet,
  lastRow: number,
  lastCol: number,
): void {
  const groupByCol = buildGroupHeaderByColumn();

  for (let r = 0; r <= lastRow; r++) {
    for (let c = 0; c <= lastCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell) continue;

      const leafId = EXPORT_LEAF_COLUMN_IDS[c];
      const groupMeta = groupByCol.get(c);

      if (r === 0) {
        const isRed = groupMeta?.headerTone === "red";
        cell.s = baseStyle({
          bold: true,
          color: isRed ? RED_HEADER_FONT : HEADER_FONT,
          fill: HEADER_BG,
          horizontal: "center",
        });
        continue;
      }

      if (r === 1) {
        cell.s = baseStyle({
          bold: true,
          fill: HEADER_BG,
          horizontal: MONEY_LEAF_IDS.has(leafId) ? "right" : "center",
        });
        continue;
      }

      const isMoney = MONEY_LEAF_IDS.has(leafId);
      const isLeft = LEFT_ALIGN_LEAF_IDS.has(leafId);
      cell.s = baseStyle({
        horizontal: isMoney ? "right" : isLeft ? "left" : "center",
        wrap: true,
      });
    }
  }
}

export function exportCustomersToExcel(rows: CustomerListRow[], filename?: string) {
  const groupRow: string[] = [];
  const leafRow: string[] = [];

  for (const g of EXPORT_GROUPS) {
    groupRow.push(g.label);
    for (let i = 1; i < g.leafLabels.length; i++) groupRow.push("");
    const standalone = g.leafLabels.length === 1 && g.label === g.leafLabels[0];
    leafRow.push(...(standalone ? [""] : g.leafLabels));
  }

  const body = rows.map((row) =>
    EXPORT_LEAF_COLUMN_IDS.map((id) => getExportCellValue(row, id)),
  );

  const aoa: (string | number)[][] = [groupRow, leafRow, ...body];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const merges: XLSX.Range[] = [];
  let col = 0;
  for (const g of EXPORT_GROUPS) {
    const span = g.leafLabels.length;
    const standalone = span === 1 && g.label === g.leafLabels[0];
    if (span > 1) {
      merges.push({
        s: { r: 0, c: col },
        e: { r: 0, c: col + span - 1 },
      });
    } else if (standalone) {
      merges.push({
        s: { r: 0, c: col },
        e: { r: 1, c: col },
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
    const leafId = EXPORT_LEAF_COLUMN_IDS[c];
    for (let r = 2; r <= lastRow; r++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell || typeof cell.v !== "number") continue;
      if (!MONEY_LEAF_IDS.has(leafId)) continue;
      cell.t = "n";
      cell.z = "#,##0.00";
    }
  }

  ensureWorksheetCells(ws, lastRow, lastCol);
  applyWorksheetStyles(ws, lastRow, lastCol);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Farmers");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, filename ?? `farmers-${stamp}.xlsx`);
}
