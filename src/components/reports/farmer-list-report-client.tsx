"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReportLocationFilters,
  ReportPagination,
  ReportToolbar,
} from "@/components/reports/report-controls";
import {
  getFarmerListReportExport,
  importFarmerListReportRows,
} from "@/app/reports/actions";
import type { FarmerListReportRow } from "@/lib/reports-types";
import { downloadReportExcel } from "@/lib/reports-export";
import {
  downloadFarmerListImportTemplate,
  FARMER_LIST_IMPORT_HEADERS,
  parseFarmerListImportFile,
  type FarmerListImportRow,
} from "@/lib/reports-import";
import { Button } from "@/components/ui/button";

type Props = {
  rows: FarmerListReportRow[];
  total: number;
  page: number;
  pageSize: number;
  filter: {
    state: string;
    district: string;
    taluk: string;
    hobbli: string;
    village: string;
    q: string;
  };
  options: {
    states: string[];
    districts: string[];
    taluks: string[];
    hobblis: string[];
    villages: string[];
  };
};

export function FarmerListReportClient({
  rows,
  total,
  page,
  pageSize,
  filter,
  options,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [pendingRows, setPendingRows] = useState<FarmerListImportRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  async function handleExport() {
    const data = await getFarmerListReportExport(filter);
    downloadReportExcel(
      "Farmer List",
      [...FARMER_LIST_IMPORT_HEADERS],
      data.map((r) => [
        r.farmerName,
        r.changedFarmerName,
        r.vendorCode,
        r.surveyNo,
        r.newSurveyNo,
        r.state,
        r.district,
        r.taluk,
        r.hobbli,
        r.village,
        r.acres,
        r.guntas,
        r.aKharab,
        r.bKharab,
      ]),
      `farmer-list-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  async function onFileSelected(file: File | undefined) {
    setImportErrors([]);
    setPendingRows(null);
    setImportMessage("");
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const result = parseFarmerListImportFile(buffer);
    if (result.headerErrors.length > 0) {
      setImportErrors(result.headerErrors);
      return;
    }
    if (result.rowErrors.length > 0) {
      setImportErrors(result.rowErrors.map((e) => `Row ${e.rowNumber}: ${e.message}`));
      return;
    }
    if (result.rows.length === 0) {
      setImportErrors(["No data rows found in the file."]);
      return;
    }
    setPendingRows(result.rows);
  }

  async function confirmImport() {
    if (!pendingRows?.length) return;
    setImporting(true);
    setImportMessage("");
    const result = await importFarmerListReportRows(
      pendingRows.map((r) => ({
        farmerName: r.farmerName,
        changedFarmerName: r.changedFarmerName,
        vendorCode: r.vendorCode,
        surveyNo: r.surveyNo,
        newSurveyNo: r.newSurveyNo,
        state: r.state,
        district: r.district,
        taluk: r.taluk,
        hobbli: r.hobbli,
        village: r.village,
        acres: r.acres,
        guntas: r.guntas,
        aKharab: r.aKharab,
        bKharab: r.bKharab,
      })),
    );
    setImporting(false);
    if (!result.ok) {
      setImportErrors([result.message]);
      return;
    }
    setPendingRows(null);
    setImportMessage(`Imported ${result.created} farmer(s). Existing records were not changed.`);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <ReportToolbar
        title="Farmer List Report"
        onExport={() => void handleExport()}
        onDownloadTemplate={() => downloadFarmerListImportTemplate()}
        onImport={() => fileRef.current?.click()}
      />
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => void onFileSelected(e.target.files?.[0])}
      />
      <ReportLocationFilters options={options} values={filter} />

      {importErrors.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-semibold">Import validation failed — nothing was imported.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {importErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {pendingRows ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>
            Ready to import <strong>{pendingRows.length}</strong> new farmer row(s). Existing
            farmers will not be overwritten.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={importing} onClick={() => void confirmImport()}>
              {importing ? "Importing…" : "Confirm Import"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={importing}
              onClick={() => setPendingRows(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {importMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {importMessage}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1100px] w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              {[...FARMER_LIST_IMPORT_HEADERS].map((h) => (
                <th key={h} className="px-2 py-2 text-left font-semibold text-slate-700">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-3 py-8 text-center text-slate-500">
                  No farmers match the selected filters.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
                  <td className="px-2 py-1.5">{r.farmerName || "—"}</td>
                  <td className="px-2 py-1.5">{r.changedFarmerName || "—"}</td>
                  <td className="px-2 py-1.5">{r.vendorCode || "—"}</td>
                  <td className="px-2 py-1.5">{r.surveyNo || "—"}</td>
                  <td className="px-2 py-1.5">{r.newSurveyNo || "—"}</td>
                  <td className="px-2 py-1.5">{r.state || "—"}</td>
                  <td className="px-2 py-1.5">{r.district || "—"}</td>
                  <td className="px-2 py-1.5">{r.taluk || "—"}</td>
                  <td className="px-2 py-1.5">{r.hobbli || "—"}</td>
                  <td className="px-2 py-1.5">{r.village || "—"}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.acres ?? "—"}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.guntas ?? "—"}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.aKharab ?? "—"}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.bKharab ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ReportPagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
