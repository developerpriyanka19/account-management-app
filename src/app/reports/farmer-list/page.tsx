import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getFarmerListReport,
  getReportLocationOptions,
} from "@/app/reports/actions";
import { FarmerListReportClient } from "@/components/reports/farmer-list-report-client";

export const metadata: Metadata = { title: "Farmer List Report" };

type Props = {
  searchParams: Promise<{
    state?: string;
    district?: string;
    taluk?: string;
    hobbli?: string;
    village?: string;
    q?: string;
    page?: string;
  }>;
};

export default async function FarmerListReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const filter = {
    state: (params.state ?? "").trim(),
    district: (params.district ?? "").trim(),
    taluk: (params.taluk ?? "").trim(),
    hobbli: (params.hobbli ?? "").trim(),
    village: (params.village ?? "").trim(),
    q: (params.q ?? "").trim(),
  };
  const pageNum = Number(params.page || "1");
  const page = Number.isFinite(pageNum) ? Math.max(1, Math.floor(pageNum)) : 1;

  const [options, result] = await Promise.all([
    getReportLocationOptions(filter),
    getFarmerListReport({ filter, page }),
  ]);

  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading report…</p>}>
      <FarmerListReportClient
        rows={result.rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        filter={filter}
        options={options}
      />
    </Suspense>
  );
}
