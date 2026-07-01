import { prisma } from "@/lib/prisma";

export type FarmerDashboardStats = {
  totalFarmers: number;
  farmersAddedThisMonth: number;
  totalShortagePaid: number;
  atlTotal: number;
  gpaPoaTotal: number;
  landConversion: number;
  otherRecoveries: number;
  podiFee: number;
  naTotal: number;
  totalGovtFee: number;
};

function sumOrZero(value: number | null | undefined): number {
  return value ?? 0;
}

/**
 * SUM per-farmer shortage:
 * COALESCE(shortageAmountTotal, cheque1 + cheque2 + cheque3)
 */
async function sumTotalShortagePaid(): Promise<number> {
  const [row] = await prisma.$queryRaw<[{ total: number | null }]>`
    SELECT SUM(
      COALESCE(
        "shortageAmountTotal",
        COALESCE("shortageChequeAmount", 0)
        + COALESCE("shortageAmountSecondTime", 0)
        + COALESCE("shortageThirdChequeAmount", 0)
      )
    )::double precision AS total
    FROM "Customer"
  `;
  return sumOrZero(row?.total);
}

/** Aggregated farmer dashboard metrics across all records. */
export async function getFarmerDashboardStats(): Promise<FarmerDashboardStats> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [totalFarmers, farmersAddedThisMonth, totalShortagePaid, sums] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({
      where: { createdAt: { gte: monthStart } },
    }),
    sumTotalShortagePaid(),
    prisma.customer.aggregate({
      _sum: {
        atlTotal: true,
        paoTotal: true,
        landConversion: true,
        otherRecoveries: true,
        podiFee: true,
        leaseDeedStampDuty: true,
        leaseDeedRegCharges: true,
      },
    }),
  ]);

  const s = sums._sum;
  const landConversion = sumOrZero(s.landConversion);
  const otherRecoveries = sumOrZero(s.otherRecoveries);
  const podiFee = sumOrZero(s.podiFee);
  const atlTotal = sumOrZero(s.atlTotal);
  const gpaPoaTotal = sumOrZero(s.paoTotal);
  const k2Challan = sumOrZero(s.leaseDeedStampDuty) + sumOrZero(s.leaseDeedRegCharges);

  return {
    totalFarmers,
    farmersAddedThisMonth,
    totalShortagePaid,
    atlTotal,
    gpaPoaTotal,
    landConversion,
    otherRecoveries,
    podiFee,
    naTotal: landConversion + otherRecoveries + podiFee,
    totalGovtFee: atlTotal + gpaPoaTotal + landConversion + otherRecoveries + podiFee + k2Challan,
  };
}
