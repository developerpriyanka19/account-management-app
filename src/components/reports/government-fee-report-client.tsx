"use client";

import {
  ReportPeriodFilters,
  ReportToolbar,
} from "@/components/reports/report-controls";
import { downloadReportExcel } from "@/lib/reports-export";
import { formatReportMoney } from "@/lib/reports-formulas";
import type { ReportPeriodPreset } from "@/lib/reports-period";

type Row = {
  id: number;
  farmerName: string;
  surveyNo: string;
  village: string;
  atlTotal: number;
  paoTotal: number;
  landConversion: number;
  otherRecoveries: number;
  podiFee: number;
  leaseDeed: number;
  total: number;
  paymentDate: string;
};

type Totals = Omit<Row, "id" | "farmerName" | "surveyNo" | "village" | "paymentDate">;

export function GovernmentFeeReportClient({
  rows,
  totals,
  preset,
  dateFrom,
  dateTo,
}: {
  rows: Row[];
  totals: Totals;
  preset: ReportPeriodPreset;
  dateFrom: string;
  dateTo: string;
}) {
  function handleExport() {
    downloadReportExcel(
      "Government Fee",
      [
        "Farmer",
        "Survey",
        "Village",
        "Payment Date",
        "ATL",
        "PAO",
        "Land Conversion",
        "Other Recoveries",
        "Podi Fee",
        "Lease Deed",
        "Total",
      ],
      [
        ...rows.map((r) => [
          r.farmerName,
          r.surveyNo,
          r.village,
          r.paymentDate,
          r.atlTotal,
          r.paoTotal,
          r.landConversion,
          r.otherRecoveries,
          r.podiFee,
          r.leaseDeed,
          r.total,
        ]),
        [
          "TOTAL",
          "",
          "",
          "",
          totals.atlTotal,
          totals.paoTotal,
          totals.landConversion,
          totals.otherRecoveries,
          totals.podiFee,
          totals.leaseDeed,
          totals.total,
        ],
      ],
      `government-fee-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <ReportToolbar title="Government Fee Report" onExport={handleExport} />
      <ReportPeriodFilters preset={preset} dateFrom={dateFrom} dateTo={dateTo} />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1000px] w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Farmer",
                "Survey",
                "Village",
                "Payment Date",
                "ATL",
                "PAO",
                "Land Conversion",
                "Other Recoveries",
                "Podi Fee",
                "Lease Deed",
                "Total",
              ].map((h) => (
                <th key={h} className="px-2 py-2 text-left font-semibold text-slate-700">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-slate-500">
                  No government fee rows for this period.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
                  <td className="px-2 py-1.5">{r.farmerName || "—"}</td>
                  <td className="px-2 py-1.5">{r.surveyNo || "—"}</td>
                  <td className="px-2 py-1.5">{r.village || "—"}</td>
                  <td className="px-2 py-1.5">{r.paymentDate}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.atlTotal)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.paoTotal)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.landConversion)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.otherRecoveries)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.podiFee)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.leaseDeed)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-medium tabular-nums">
                    {formatReportMoney(r.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 ? (
            <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold">
              <tr>
                <td className="px-2 py-2" colSpan={4}>
                  Totals
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.atlTotal)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.paoTotal)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.landConversion)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.otherRecoveries)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.podiFee)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.leaseDeed)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.total)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
