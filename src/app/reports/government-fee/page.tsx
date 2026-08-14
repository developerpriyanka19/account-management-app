import type { Metadata } from "next";
import { Suspense } from "react";
import { getGovernmentFeeReport } from "@/app/reports/actions";
import { GovernmentFeeReportClient } from "@/components/reports/government-fee-report-client";
import type { ReportPeriodPreset } from "@/lib/reports-period";

export const metadata: Metadata = { title: "Government Fee Report" };

type Props = {
  searchParams: Promise<{
    preset?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

function parsePreset(value: string | undefined): ReportPeriodPreset {
  if (value === "last6" || value === "last3" || value === "custom" || value === "annual") {
    return value;
  }
  return "annual";
}

export default async function GovernmentFeeReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const preset = parsePreset(params.preset);
  const dateFrom = (params.dateFrom ?? "").trim();
  const dateTo = (params.dateTo ?? "").trim();
  const result = await getGovernmentFeeReport({ preset, dateFrom, dateTo });

  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading report…</p>}>
      <GovernmentFeeReportClient
        rows={result.rows}
        totals={result.totals}
        preset={preset}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </Suspense>
  );
}
