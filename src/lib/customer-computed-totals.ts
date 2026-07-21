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
  tdsAmount?: string | number | null;
  loanAmount?: string | number | null;
  leaseAmount?: string | number | null;
  rentalDdPart1Amount?: string | number | null;
  otherCharges?: string | number | null;
  cropCompensation?: string | number | null;
  atlTotal?: string | number | null;
  paoTotal?: string | number | null;
  landConversion?: string | number | null;
  otherRecoveries?: string | number | null;
  podiFee?: string | number | null;
  leaseDeedStampDuty?: string | number | null;
  leaseDeedRegCharges?: string | number | null;
};

export type TotalPaidToFarmerInput = Pick<
  FarmerDerivedInput,
  | "aesAdvanceChequeAmount"
  | "shortageChequeAmount"
  | "shortageAmountSecondTime"
  | "shortageThirdChequeAmount"
  | "tdsAmount"
  | "loanAmount"
  | "leaseAmount"
  | "rentalDdPart1Amount"
  | "otherCharges"
  | "cropCompensation"
> & {
  shortageAmountTotal?: string | number | null;
};

export type FarmerDerivedFields = {
  totalGunta: number;
  totalCents: number;
  rentAmount: number;
  balanceRentAmount: number;
  shortageAmountTotal: number;
  totalPaidToFarmer: number;
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
  aesAdvanceChequeAmount?: string | number | null;
};

/**
 * Total AES Paid =
 * AES Shortage Cheque One + Two + Three + AES Advance Per Acre Cheque Amount
 * (null / empty / invalid → 0).
 */
export function computeShortageAmountTotal(input: ShortageTotalsInput): number {
  return (
    parseAsZero(input.shortageChequeAmount) +
    parseAsZero(input.shortageAmountSecondTime) +
    parseAsZero(input.shortageThirdChequeAmount) +
    parseAsZero(input.aesAdvanceChequeAmount)
  );
}

/** Alias for Total AES Paid — same formula as computeShortageAmountTotal. */
export function computeTotalAesPaid(input: ShortageTotalsInput): number {
  return computeShortageAmountTotal(input);
}

/**
 * Total Paid to Farmer =
 * Total AES Paid (includes Cheque Amount — do not add Cheque separately)
 * + TDS Amount
 * + Bank Loan DD From Company Amount
 * + Rental DD From Company 1 Amount
 * + Rental DD From Company 2 Amount
 * + Other Charges
 * + Crop Compensation
 */
export function computeTotalPaidToFarmer(input: TotalPaidToFarmerInput): number {
  return (
    resolveShortageAmountTotal(input) +
    parseAsZero(input.tdsAmount) +
    parseAsZero(input.loanAmount) +
    parseAsZero(input.leaseAmount) +
    parseAsZero(input.rentalDdPart1Amount) +
    parseAsZero(input.otherCharges) +
    parseAsZero(input.cropCompensation)
  );
}

export type ResolvedShortageInput = ShortageTotalsInput & {
  shortageAmountTotal?: string | number | null;
};

/**
 * Prefer recomputing Total AES Paid from source amounts.
 * Falls back to stored total only when all source fields are empty.
 */
export function resolveShortageAmountTotal(input: ResolvedShortageInput): number {
  const hasSource =
    input.shortageChequeAmount != null ||
    input.shortageAmountSecondTime != null ||
    input.shortageThirdChequeAmount != null ||
    input.aesAdvanceChequeAmount != null;
  if (hasSource) return computeShortageAmountTotal(input);
  const stored = parseOptionalNumber(input.shortageAmountTotal);
  if (stored != null) return stored;
  return 0;
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
  const totalPaidToFarmer = computeTotalPaidToFarmer(input);
  const totalGovtFee = computeTotalGovtFee(input);

  return {
    totalGunta,
    totalCents,
    rentAmount,
    balanceRentAmount,
    shortageAmountTotal,
    totalPaidToFarmer,
    totalGovtFee,
  };
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundToThreeDecimals(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function formatComputedTotal(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return roundToTwoDecimals(value).toFixed(2);
}

/** Total Cents — always 3 decimal places (e.g. 1.700). */
export function formatTotalCents(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return roundToThreeDecimals(value).toFixed(3);
}
