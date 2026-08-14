"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getFarmerOptionsForReport,
  getIndividualFarmerReport,
} from "@/app/reports/actions";
import { ReportToolbar } from "@/components/reports/report-controls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadReportExcel } from "@/lib/reports-export";
import { formatReportMoney } from "@/lib/reports-formulas";
import { toDisplayDate } from "@/lib/date-format";
import { printIndividualFarmerReportPdf } from "@/lib/individual-farmer-report-pdf";

type FarmerOption = { id: number; label: string };
type ReportData = NonNullable<Awaited<ReturnType<typeof getIndividualFarmerReport>>>;

export function IndividualFarmerReportClient({
  initialFarmerId,
  initialData,
}: {
  initialFarmerId: number | null;
  initialData: ReportData | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<FarmerOption[]>([]);
  const [pending, startTransition] = useTransition();
  const data = initialData;

  useEffect(() => {
    let cancelled = false;
    void getFarmerOptionsForReport(query).then((rows) => {
      if (!cancelled) setOptions(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  function selectFarmer(id: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("farmerId", String(id));
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  function handleExport() {
    if (!data) return;
    const f = data.farmer;
    downloadReportExcel(
      "Individual Farmer",
      ["Field", "Value"],
      [
        ["Name", f.farmerName],
        ["Changed Name", f.changedFarmerName],
        ["Vendor", f.vendorCode],
        ["Survey", f.surveyNo],
        ["New Survey", f.newSurveyNo],
        ["State", f.state],
        ["District", f.district],
        ["Taluk", f.taluk],
        ["Hobli", f.hobbli],
        ["Village", f.village],
        ["RTC Acre", f.rtcExtentAcre],
        ["RTC Gunta", f.rtcExtentGunta],
        ["Lease Acre", f.leaseExtentAcre],
        ["Lease Gunta", f.leaseExtentGunta],
        ["Payment Total", data.paymentSummary.total],
        ["Govt Fee Total", data.govtFeeSummary.total],
      ],
      `individual-farmer-${f.id}.xlsx`,
    );
  }

  function handlePrint() {
    if (!data) return;
    void printIndividualFarmerReportPdf({
      farmer: data.farmer,
      paymentSummary: data.paymentSummary,
      govtFeeSummary: data.govtFeeSummary,
      invoices: data.invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        total: inv.lineAmount,
        status: inv.status,
      })),
      debitNotes: data.debitNotes.map((dn) => ({
        debitNoteNo: dn.debitNoteNo,
        date: dn.date,
        total: dn.lineTotal,
        type: dn.type,
      })),
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <ReportToolbar
        title="Individual Farmer Report"
        onExport={data ? handleExport : undefined}
        onPrint={data ? handlePrint : undefined}
      />

      <section className="print:hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <Label>Select farmer</Label>
        <Input
          className="mt-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or survey number"
        />
        <div className="mt-2 max-h-48 overflow-auto rounded border border-slate-100">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={pending}
              className={`flex w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                initialFarmerId === opt.id ? "bg-blue-50 text-blue-800" : ""
              }`}
              onClick={() => selectFarmer(opt.id)}
            >
              {opt.label}
            </button>
          ))}
          {options.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">No farmers found.</p>
          ) : null}
        </div>
      </section>

      {!data ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Select a farmer to view the report.
        </div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#111827]">Basic & Location</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Name", data.farmer.farmerName],
                ["Changed Name", data.farmer.changedFarmerName],
                ["Vendor", data.farmer.vendorCode],
                ["Survey", data.farmer.surveyNo],
                ["New Survey", data.farmer.newSurveyNo],
                ["State", data.farmer.state],
                ["District", data.farmer.district],
                ["Taluk", data.farmer.taluk],
                ["Hobli", data.farmer.hobbli],
                ["Village", data.farmer.village],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-800">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#111827]">Survey & Extent</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["RTC Acre", data.farmer.rtcExtentAcre],
                ["RTC Gunta", data.farmer.rtcExtentGunta],
                ["A Kharab", data.farmer.rtcAKharab],
                ["B Kharab", data.farmer.rtcBKharab],
                ["Lease Acre", data.farmer.leaseExtentAcre],
                ["Lease Gunta", data.farmer.leaseExtentGunta],
                ["Total Gunta", data.farmer.totalGunta],
                ["Total Cents", data.farmer.totalCents],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="font-medium tabular-nums text-slate-800">
                    {value == null ? "—" : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#111827]">Payment Summary</h2>
            <p className="mt-2 text-lg font-semibold tabular-nums text-[#111827]">
              ₹{formatReportMoney(data.paymentSummary.total)}
            </p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Loan", data.paymentSummary.loanAmount],
                ["Lease", data.paymentSummary.leaseAmount],
                ["Rental DD Part 1", data.paymentSummary.rentalDdPart1Amount],
                ["AES Advance", data.paymentSummary.aesAdvanceChequeAmount],
                ["Shortage", data.paymentSummary.shortageChequeAmount],
                ["Shortage 2nd", data.paymentSummary.shortageAmountSecondTime],
                ["Shortage 3rd", data.paymentSummary.shortageThirdChequeAmount],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="tabular-nums">₹{formatReportMoney(Number(value))}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#111827]">Government Fee Summary</h2>
            <p className="mt-2 text-lg font-semibold tabular-nums text-[#111827]">
              ₹{formatReportMoney(data.govtFeeSummary.total)}
            </p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["ATL", data.govtFeeSummary.atlTotal],
                ["PAO", data.govtFeeSummary.paoTotal],
                ["Land Conversion", data.govtFeeSummary.landConversion],
                ["Other Recoveries", data.govtFeeSummary.otherRecoveries],
                ["Podi Fee", data.govtFeeSummary.podiFee],
                ["Lease Deed", data.govtFeeSummary.leaseDeed],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="tabular-nums">₹{formatReportMoney(Number(value))}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#111827]">Related Invoices</h2>
            {data.invoices.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No related invoices.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-[700px] w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-2 text-left">Invoice No</th>
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2 text-left">Type</th>
                      <th className="px-2 py-2 text-left">Sub-Type</th>
                      <th className="px-2 py-2 text-right">Line Amount</th>
                      <th className="px-2 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map((inv) => (
                      <tr key={`${inv.id}-${inv.invoiceNumber}`} className="border-t border-slate-100">
                        <td className="px-2 py-1.5">{inv.invoiceNumber}</td>
                        <td className="px-2 py-1.5">{toDisplayDate(inv.invoiceDate) || inv.invoiceDate}</td>
                        <td className="px-2 py-1.5">{inv.invoiceType}</td>
                        <td className="px-2 py-1.5">{inv.subType}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          ₹{formatReportMoney(inv.lineAmount)}
                        </td>
                        <td className="px-2 py-1.5">{inv.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#111827]">Related Debit Notes</h2>
            {data.debitNotes.length === 0 && data.legacyDebitNotes.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No related debit notes.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-[700px] w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-2 py-2 text-left">Debit Note No</th>
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2 text-left">Type</th>
                      <th className="px-2 py-2 text-right">Amount</th>
                      <th className="px-2 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.debitNotes.map((dn) => (
                      <tr key={dn.id} className="border-t border-slate-100">
                        <td className="px-2 py-1.5">{dn.debitNoteNo}</td>
                        <td className="px-2 py-1.5">{toDisplayDate(dn.date) || dn.date}</td>
                        <td className="px-2 py-1.5">{dn.type}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          ₹{formatReportMoney(dn.lineTotal)}
                        </td>
                        <td className="px-2 py-1.5">{dn.status}</td>
                      </tr>
                    ))}
                    {data.legacyDebitNotes.map((dn) => (
                      <tr key={`legacy-${dn.id}`} className="border-t border-slate-100">
                        <td className="px-2 py-1.5">{dn.dbNo || "—"}</td>
                        <td className="px-2 py-1.5">—</td>
                        <td className="px-2 py-1.5">{dn.category}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          ₹{formatReportMoney(dn.amount)}
                        </td>
                        <td className="px-2 py-1.5">Legacy</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4">
            <h2 className="text-sm font-semibold text-slate-700">Additional sections coming soon</h2>
            <p className="mt-1 text-sm text-slate-500">
              More farmer analytics and timeline views will appear here.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
