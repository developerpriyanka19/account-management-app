import { prisma } from "@/lib/prisma";

export type FarmerDashboardStats = {
  totalFarmers: number;
  farmersAddedThisMonth: number;
  totalAesPaid: number;
  totalLoanDdFromCompany: number;
  totalRentDdFromCompany: number;
  totalOtherCharges: number;
  totalCropCompensation: number;
  totalPaidToFarmer: number;
  atlTotal: number;
  gpaPoaTotal: number;
  landConversion: number;
  otherRecoveries: number;
  podiFee: number;
  naTotal: number;
  leaseDeedK2Challan: number;
  totalGovtFee: number;
};

function sumOrZero(value: number | null | undefined): number {
  return value ?? 0;
}

/**
 * Total AES Paid =
 * SUM(
 *   AES Shortage Cheque One
 *   + AES Shortage Cheque Two
 *   + AES Shortage Cheque Three
 *   + AES Advance Per Acre Cheque Amount
 * )
 */
async function sumTotalAesPaid(): Promise<number> {
  const [row] = await prisma.$queryRaw<[{ total: number | null }]>`
    SELECT SUM(
      COALESCE("shortageChequeAmount", 0)
      + COALESCE("shortageAmountSecondTime", 0)
      + COALESCE("shortageThirdChequeAmount", 0)
      + COALESCE("aesAdvanceChequeAmount", 0)
    )::double precision AS total
    FROM "Customer"
  `;
  return sumOrZero(row?.total);
}

/**
 * Sum of Total Paid to Farmer across all farmers (same formula as the farmer list).
 */
async function sumTotalPaidToFarmer(): Promise<number> {
  const [row] = await prisma.$queryRaw<[{ total: number | null }]>`
    SELECT SUM(
      COALESCE("shortageChequeAmount", 0)
      + COALESCE("shortageAmountSecondTime", 0)
      + COALESCE("shortageThirdChequeAmount", 0)
      + COALESCE("aesAdvanceChequeAmount", 0)
      + COALESCE("tdsAmount", 0)
      + COALESCE("loanAmount", 0)
      + COALESCE("leaseAmount", 0)
      + COALESCE("rentalDdPart1Amount", 0)
      + COALESCE("otherCharges", 0)
      + COALESCE("cropCompensation", 0)
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

  const [totalFarmers, farmersAddedThisMonth, totalAesPaid, totalPaidToFarmer, sums] =
    await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({
        where: { createdAt: { gte: monthStart } },
      }),
      sumTotalAesPaid(),
      sumTotalPaidToFarmer(),
      prisma.customer.aggregate({
        _sum: {
          loanAmount: true,
          leaseAmount: true,
          rentalDdPart1Amount: true,
          otherCharges: true,
          cropCompensation: true,
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
  const leaseDeedK2Challan =
    sumOrZero(s.leaseDeedStampDuty) + sumOrZero(s.leaseDeedRegCharges);

  return {
    totalFarmers,
    farmersAddedThisMonth,
    totalAesPaid,
    totalLoanDdFromCompany: sumOrZero(s.loanAmount),
    totalRentDdFromCompany: sumOrZero(s.leaseAmount) + sumOrZero(s.rentalDdPart1Amount),
    totalOtherCharges: sumOrZero(s.otherCharges),
    totalCropCompensation: sumOrZero(s.cropCompensation),
    totalPaidToFarmer,
    atlTotal,
    gpaPoaTotal,
    landConversion,
    otherRecoveries,
    podiFee,
    naTotal: landConversion + otherRecoveries + podiFee,
    leaseDeedK2Challan,
    totalGovtFee:
      atlTotal + gpaPoaTotal + landConversion + otherRecoveries + podiFee + leaseDeedK2Challan,
  };
}
