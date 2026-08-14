import * as XLSX from "xlsx-js-style";

export function downloadReportExcel(
  sheetName: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string,
) {
  const aoa: (string | number)[][] = [
    headers,
    ...rows.map((row) => row.map((cell) => (cell == null ? "" : cell))),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = headers.map((h, i) => {
    const max = Math.max(h.length, ...aoa.slice(1).map((r) => String(r[i] ?? "").length), 8);
    return { wch: Math.min(Math.max(max + 2, 10), 40) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename);
}
