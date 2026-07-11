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
  loanAmount: number;
  leaseAmount: number;
  rentalDdPart1Amount: number;
  aesAdvanceChequeAmount: number;
  shortageChequeAmount: number;
  shortageAmountSecondTime: number;
  shortageThirdChequeAmount: number;
  total: number;
  paymentDate: string;
};

type Totals = Omit<Row, "id" | "farmerName" | "surveyNo" | "village" | "paymentDate">;

export function CompanyPaymentReportClient({
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
      "Company Payment",
      [
        "Farmer",
        "Survey",
        "Village",
        "Payment Date",
        "Loan",
        "Lease",
        "Rental DD Part 1",
        "AES Advance",
        "Shortage",
        "Shortage 2nd",
        "Shortage 3rd",
        "Total",
      ],
      [
        ...rows.map((r) => [
          r.farmerName,
          r.surveyNo,
          r.village,
          r.paymentDate,
          r.loanAmount,
          r.leaseAmount,
          r.rentalDdPart1Amount,
          r.aesAdvanceChequeAmount,
          r.shortageChequeAmount,
          r.shortageAmountSecondTime,
          r.shortageThirdChequeAmount,
          r.total,
        ]),
        [
          "TOTAL",
          "",
          "",
          "",
          totals.loanAmount,
          totals.leaseAmount,
          totals.rentalDdPart1Amount,
          totals.aesAdvanceChequeAmount,
          totals.shortageChequeAmount,
          totals.shortageAmountSecondTime,
          totals.shortageThirdChequeAmount,
          totals.total,
        ],
      ],
      `company-payment-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <ReportToolbar title="Company Payment Report" onExport={handleExport} />
      <ReportPeriodFilters preset={preset} dateFrom={dateFrom} dateTo={dateTo} />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1100px] w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Farmer",
                "Survey",
                "Village",
                "Payment Date",
                "Loan",
                "Lease",
                "Rental DD Part 1",
                "AES Advance",
                "Shortage",
                "Shortage 2nd",
                "Shortage 3rd",
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
                <td colSpan={12} className="px-3 py-8 text-center text-slate-500">
                  No payment rows for this period.
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
                    {formatReportMoney(r.loanAmount)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.leaseAmount)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.rentalDdPart1Amount)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.aesAdvanceChequeAmount)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.shortageChequeAmount)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.shortageAmountSecondTime)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatReportMoney(r.shortageThirdChequeAmount)}
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
                  {formatReportMoney(totals.loanAmount)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.leaseAmount)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.rentalDdPart1Amount)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.aesAdvanceChequeAmount)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.shortageChequeAmount)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.shortageAmountSecondTime)}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {formatReportMoney(totals.shortageThirdChequeAmount)}
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
