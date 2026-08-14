import * as XLSX from "xlsx-js-style";
import { downloadReportExcel } from "@/lib/reports-export";

/** Exact headers used by Farmer List export — import templates must match. */
export const FARMER_LIST_IMPORT_HEADERS = [
  "Name",
  "Changed Name",
  "Vendor",
  "Survey",
  "New Survey",
  "State",
  "District",
  "Taluk",
  "Hobli",
  "Village",
  "Acres",
  "Guntas",
  "A Kharab",
  "B Kharab",
] as const;

export type FarmerListImportRow = {
  rowNumber: number;
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
  acres: number | null;
  guntas: number | null;
  aKharab: number | null;
  bKharab: number | null;
};

export type FarmerListImportValidation = {
  ok: boolean;
  headerErrors: string[];
  rowErrors: { rowNumber: number; message: string }[];
  rows: FarmerListImportRow[];
};

function cellStr(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function cellNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : Number.NaN;
}

export function downloadFarmerListImportTemplate() {
  downloadReportExcel(
    "Farmer List Template",
    [...FARMER_LIST_IMPORT_HEADERS],
    [
      [
        "Sample Farmer",
        "",
        "V001",
        "12/1",
        "",
        "Karnataka",
        "Dharwad",
        "Hubballi",
        "Sample Hobli",
        "Sample Village",
        1.5,
        10,
        0,
        0,
      ],
    ],
    "farmer-list-import-template.xlsx",
  );
}

export function parseFarmerListImportFile(buffer: ArrayBuffer): FarmerListImportValidation {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { ok: false, headerErrors: ["Workbook has no sheets."], rowErrors: [], rows: [] };
  }
  const sheet = workbook.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });
  if (aoa.length < 1) {
    return { ok: false, headerErrors: ["File is empty."], rowErrors: [], rows: [] };
  }

  const headerRow = (aoa[0] ?? []).map((h) => cellStr(h));
  const headerErrors: string[] = [];
  for (let i = 0; i < FARMER_LIST_IMPORT_HEADERS.length; i++) {
    const expected = FARMER_LIST_IMPORT_HEADERS[i]!;
    const actual = headerRow[i] ?? "";
    if (actual !== expected) {
      headerErrors.push(
        `Column ${i + 1}: expected "${expected}"${actual ? `, found "${actual}"` : " (missing)"}`,
      );
    }
  }
  if (headerErrors.length > 0) {
    return { ok: false, headerErrors, rowErrors: [], rows: [] };
  }

  const rowErrors: { rowNumber: number; message: string }[] = [];
  const rows: FarmerListImportRow[] = [];

  for (let i = 1; i < aoa.length; i++) {
    const raw = aoa[i] ?? [];
    const rowNumber = i + 1;
    const isBlank = FARMER_LIST_IMPORT_HEADERS.every((_, col) => cellStr(raw[col]) === "");
    if (isBlank) continue;

    const farmerName = cellStr(raw[0]);
    const state = cellStr(raw[5]);
    const district = cellStr(raw[6]);
    const taluk = cellStr(raw[7]);
    const hobbli = cellStr(raw[8]);
    const village = cellStr(raw[9]);
    const acres = cellNum(raw[10]);
    const guntas = cellNum(raw[11]);
    const aKharab = cellNum(raw[12]);
    const bKharab = cellNum(raw[13]);

    const messages: string[] = [];
    if (!farmerName) messages.push("Name is required");
    if (!state) messages.push("State is required");
    if (!district) messages.push("District is required");
    if (!taluk) messages.push("Taluk is required");
    if (!hobbli) messages.push("Hobli is required");
    if (!village) messages.push("Village is required");
    if (Number.isNaN(acres as number)) messages.push("Acres must be a number");
    if (Number.isNaN(guntas as number)) messages.push("Guntas must be a number");
    if (Number.isNaN(aKharab as number)) messages.push("A Kharab must be a number");
    if (Number.isNaN(bKharab as number)) messages.push("B Kharab must be a number");

    if (messages.length > 0) {
      rowErrors.push({ rowNumber, message: messages.join("; ") });
      continue;
    }

    rows.push({
      rowNumber,
      farmerName,
      changedFarmerName: cellStr(raw[1]),
      vendorCode: cellStr(raw[2]),
      surveyNo: cellStr(raw[3]),
      newSurveyNo: cellStr(raw[4]),
      state,
      district,
      taluk,
      hobbli,
      village,
      acres: acres as number | null,
      guntas: guntas as number | null,
      aKharab: aKharab as number | null,
      bKharab: bKharab as number | null,
    });
  }

  return {
    ok: rowErrors.length === 0 && rows.length > 0,
    headerErrors: [],
    rowErrors,
    rows,
  };
}
