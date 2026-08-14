import {
  computeLeaseDeedK2Challan,
  computeTotalGovtFee,
  parseAsZero,
} from "@/lib/customer-computed-totals";

export function computeCompanyPaymentTotal(input: {
  loanAmount?: number | null;
  leaseAmount?: number | null;
  rentalDdPart1Amount?: number | null;
  aesAdvanceChequeAmount?: number | null;
  shortageChequeAmount?: number | null;
  shortageAmountSecondTime?: number | null;
  shortageThirdChequeAmount?: number | null;
}): number {
  return (
    parseAsZero(input.loanAmount) +
    parseAsZero(input.leaseAmount) +
    parseAsZero(input.rentalDdPart1Amount) +
    parseAsZero(input.aesAdvanceChequeAmount) +
    parseAsZero(input.shortageChequeAmount) +
    parseAsZero(input.shortageAmountSecondTime) +
    parseAsZero(input.shortageThirdChequeAmount)
  );
}

export function computeGovtFeeBreakdown(input: {
  atlTotal?: number | null;
  paoTotal?: number | null;
  landConversion?: number | null;
  otherRecoveries?: number | null;
  podiFee?: number | null;
  leaseDeedStampDuty?: number | null;
  leaseDeedRegCharges?: number | null;
  totalGovtFee?: number | null;
}) {
  const atlTotal = parseAsZero(input.atlTotal);
  const paoTotal = parseAsZero(input.paoTotal);
  const landConversion = parseAsZero(input.landConversion);
  const otherRecoveries = parseAsZero(input.otherRecoveries);
  const podiFee = parseAsZero(input.podiFee);
  const leaseDeed =
    computeLeaseDeedK2Challan(input.leaseDeedStampDuty, input.leaseDeedRegCharges);
  const computed = computeTotalGovtFee(input);
  const total =
    input.totalGovtFee != null && Number.isFinite(input.totalGovtFee)
      ? Number(input.totalGovtFee)
      : computed;

  return {
    atlTotal,
    paoTotal,
    landConversion,
    otherRecoveries,
    podiFee,
    leaseDeed,
    total,
  };
}

export function formatReportMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
