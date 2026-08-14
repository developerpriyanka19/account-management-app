import type { Metadata } from "next";
import { Suspense } from "react";
import { getIndividualFarmerReport } from "@/app/reports/actions";
import { IndividualFarmerReportClient } from "@/components/reports/individual-farmer-report-client";

export const metadata: Metadata = { title: "Individual Farmer Report" };

type Props = {
  searchParams: Promise<{ farmerId?: string }>;
};

export default async function IndividualFarmerReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const farmerIdNum = Number(params.farmerId ?? "");
  const farmerId =
    Number.isInteger(farmerIdNum) && farmerIdNum > 0 ? farmerIdNum : null;
  const data = farmerId ? await getIndividualFarmerReport(farmerId) : null;

  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading report…</p>}>
      <IndividualFarmerReportClient initialFarmerId={farmerId} initialData={data} />
    </Suspense>
  );
}
