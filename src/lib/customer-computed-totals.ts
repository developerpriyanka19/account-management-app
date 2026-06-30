/** Karnataka land units: 1 acre = 40 guntas; 2.5 guntas = 1 cent. */
export const GUNTAS_PER_ACRE = 40;
export const GUNTAS_PER_CENT = 2.5;

export type FarmerDerivedInput = {
  leaseExtentAcre?: string | number | null;
  leaseExtentGunta?: string | number | null;
  rentPerAcre?: string | number | null;
  aesAdvanceChequeAmount?: string | number | null;
  shortageChequeAmount?: string | number | null;
  shortageAmountSecondTime?: string | number | null;
  shortageThirdChequeAmount?: string | number | null;
  atlTotal?: string | number | null;
  paoTotal?: string | number | null;
  landConversion?: string | number | null;
  otherRecoveries?: string | number | null;
  podiFee?: string | number | null;
  leaseDeedStampDuty?: string | number | null;
  leaseDeedRegCharges?: string | number | null;
};

export type FarmerDerivedFields = {
  totalGunta: number;
  totalCents: number;
  rentAmount: number;
  balanceRentAmount: number;
  shortageAmountTotal: number;
  totalGovtFee: number;
};

function parseOptionalNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Empty or invalid numeric input is treated as 0 in auto-calculations. */
export function parseAsZero(value: string | number | null | undefined): number {
  return parseOptionalNumber(value) ?? 0;
}

/** Decimal acres from acre + gunta (40 guntas = 1 acre). Returns null when both are empty/zero. */
export function extentToAcres(
  acres: number | null | undefined,
  gunta: number | null | undefined,
): number | null {
  const a = parseOptionalNumber(acres);
  const g = parseOptionalNumber(gunta);
  if (a == null && g == null) return null;
  const total = parseAsZero(acres) + parseAsZero(gunta) / GUNTAS_PER_ACRE;
  return total > 0 ? total : null;
}

/** Total Gunta = (Lease Extent Acre × 40) + Lease Extent Gunta */
export function computeTotalGuntaFromLease(input: FarmerDerivedInput): number {
  const acre = parseAsZero(input.leaseExtentAcre);
  const gunta = parseAsZero(input.leaseExtentGunta);
  return acre * GUNTAS_PER_ACRE + gunta;
}

/** Total Cents = (Total Gunta × 2.5) / 100 */
export function computeTotalCentsFromGunta(totalGunta: number): number {
  return (totalGunta * GUNTAS_PER_CENT) / 100;
}

/** Total Rent = Total Cents × Rent Per Acre (No. of Years excluded for now). */
export function computeTotalRentFromCents(totalCents: number, rentPerAcre: number): number {
  return totalCents * rentPerAcre;
}

/** Balance Rent Amount = Total Rent − AES Advance Cheque Amount */
export function computeBalanceRentAmount(totalRent: number, chequeAmount: number): number {
  return totalRent - chequeAmount;
}

export type ShortageTotalsInput = {
  shortageChequeAmount?: string | number | null;
  shortageAmountSecondTime?: string | number | null;
  shortageThirdChequeAmount?: string | number | null;
};

/** Sum of first, second, and third shortage cheque amounts (empty = 0). */
export function computeShortageAmountTotal(input: ShortageTotalsInput): number {
  return (
    parseAsZero(input.shortageChequeAmount) +
    parseAsZero(input.shortageAmountSecondTime) +
    parseAsZero(input.shortageThirdChequeAmount)
  );
}

/** Lease Deed K2 Challan = Stamp Duty + Reg Charges */
export function computeLeaseDeedK2Challan(
  stamp: string | number | null | undefined,
  reg: string | number | null | undefined,
): number {
  return parseAsZero(stamp) + parseAsZero(reg);
}

/** Total Govt Fee = ATL + POA/GPA + Land Conversion + Other Recoveries + Podi + K2 Challan */
export function computeTotalGovtFee(input: FarmerDerivedInput): number {
  const k2 = computeLeaseDeedK2Challan(input.leaseDeedStampDuty, input.leaseDeedRegCharges);
  return (
    parseAsZero(input.atlTotal) +
    parseAsZero(input.paoTotal) +
    parseAsZero(input.landConversion) +
    parseAsZero(input.otherRecoveries) +
    parseAsZero(input.podiFee) +
    k2
  );
}

/** All farmer auto-calculated fields from current inputs. */
export function computeFarmerDerivedFields(input: FarmerDerivedInput): FarmerDerivedFields {
  const totalGunta = computeTotalGuntaFromLease(input);
  const totalCents = computeTotalCentsFromGunta(totalGunta);
  const rentAmount = computeTotalRentFromCents(totalCents, parseAsZero(input.rentPerAcre));
  const balanceRentAmount = computeBalanceRentAmount(
    rentAmount,
    parseAsZero(input.aesAdvanceChequeAmount),
  );
  const shortageAmountTotal = computeShortageAmountTotal(input);
  const totalGovtFee = computeTotalGovtFee(input);

  return {
    totalGunta,
    totalCents,
    rentAmount,
    balanceRentAmount,
    shortageAmountTotal,
    totalGovtFee,
  };
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatComputedTotal(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return roundToTwoDecimals(value).toFixed(2);
}
