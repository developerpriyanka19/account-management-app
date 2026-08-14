import {
  computeFarmerDerivedFields,
  computeLeaseDeedK2Challan,
  formatTotalCents,
  GUNTAS_PER_ACRE,
  parseAsZero,
  roundToTwoDecimals,
} from "@/lib/customer-computed-totals";
import { formatAmount } from "@/lib/customer-display";
import { lineAmountFromExtent } from "@/lib/invoice-calculations";
import type { AtlPoaRow, DebitNoteFarmerOption, LandConversionRow } from "@/lib/debit-note-types";

/** Farmer master fields used when building debit note / service order rows. */
export type DebitNoteFarmerMaster = DebitNoteFarmerOption & {
  changedFarmerName?: string | null;
  vendorCode?: string | null;
  newSurveyNo?: string | null;
  rtcAKharab?: number | null;
  rtcBKharab?: number | null;
  balanceExtentAcre?: number | null;
  balanceExtentGunta?: number | null;
  leaseDeedStampDuty?: number | null;
  leaseDeedRegCharges?: number | null;
  rentPerAcre?: number | null;
  landConversion?: number | null;
  podiFee?: number | null;
  otherRecoveries?: number | null;
  atlTotal?: number | null;
  paoTotal?: number | null;
  aesAdvanceChequeNo?: string | null;
  aesAdvanceDate?: string | null;
  aesAdvanceChequeAmount?: number | null;
  aesAdvanceBankName?: string | null;
};

/** K2 challan fee stored on farmer master (stamp duty + reg charges). */
export function k2ChallanFeeFromFarmer(farmer: DebitNoteFarmerMaster): number {
  return roundToTwoDecimals(
    computeLeaseDeedK2Challan(farmer.leaseDeedStampDuty, farmer.leaseDeedRegCharges),
  );
}

export function hasMasterText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function hasMasterExtent(value: number | null | undefined): boolean {
  return value != null && !Number.isNaN(value);
}

export function hasMasterMoney(value: number | null | undefined): boolean {
  return parseAsZero(value) > 0;
}

/** Prefer farmer master K2 fee; fall back to lease acres × rate per acre. */
export function resolveK2ChallanFee(
  farmer: DebitNoteFarmerMaster,
  ratePerAcre = 0,
): number {
  const masterFee = k2ChallanFeeFromFarmer(farmer);
  if (masterFee > 0) return masterFee;
  if (ratePerAcre > 0) return roundToTwoDecimals(k2FeeFromRate(farmer, ratePerAcre));
  return 0;
}

export function resolveLeaseExtent(farmer: DebitNoteFarmerMaster): {
  acres: number | null;
  gunta: number | null;
} {
  const acres =
    farmer.leaseExtentAcre ?? farmer.rtcExtentAcre ?? farmer.balanceExtentAcre ?? null;
  const gunta =
    farmer.leaseExtentGunta ?? farmer.rtcExtentGunta ?? farmer.balanceExtentGunta ?? null;
  return { acres, gunta: gunta };
}

/** Fee from NA/lease extent × rate per acre. */
export function extentFeeFromRate(
  farmer: DebitNoteFarmerMaster,
  ratePerAcre: number,
): number {
  const { acres, gunta } = resolveLeaseExtent(farmer);
  return lineAmountFromExtent(acres, gunta, ratePerAcre);
}

/** Prefer farmer master amount; fall back to extent × rate per acre. */
export function resolveFeeFromMasterOrRate(
  masterAmount: number | null | undefined,
  farmer: DebitNoteFarmerMaster,
  ratePerAcre = 0,
): number {
  const master = roundToTwoDecimals(parseAsZero(masterAmount));
  if (master > 0) return master;
  if (ratePerAcre > 0) return roundToTwoDecimals(extentFeeFromRate(farmer, ratePerAcre));
  return 0;
}

/** K2 / service order fee = decimal lease acres × rate per acre. */
export function k2FeeFromRate(farmer: DebitNoteFarmerMaster, ratePerAcre: number): number {
  return extentFeeFromRate(farmer, ratePerAcre);
}

export function normalizeAcresGuntas(
  acres: number,
  gunta: number,
): { acres: number; gunta: number } {
  const total = Math.round(acres * GUNTAS_PER_ACRE + gunta);
  const normAcres = Math.floor(total / GUNTAS_PER_ACRE);
  const normGunta = total % GUNTAS_PER_ACRE;
  return { acres: normAcres, gunta: normGunta };
}

export function formatReadOnlyExtent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatAmount(value);
}

/** Build a land conversion debit note row from farmer master. */
export function buildLandConversionRowFromFarmer(
  farmer: DebitNoteFarmerMaster,
  ratePerAcre = 0,
): LandConversionRow {
  const derived = computeFarmerDerivedFields({
    leaseExtentAcre: farmer.leaseExtentAcre,
    leaseExtentGunta: farmer.leaseExtentGunta,
  });
  const { acres, gunta } = resolveLeaseExtent(farmer);
  const landConversionFee = resolveFeeFromMasterOrRate(
    farmer.landConversion,
    farmer,
    ratePerAcre,
  );
  const podi = roundToTwoDecimals(parseAsZero(farmer.podiFee));
  const recovery = roundToTwoDecimals(parseAsZero(farmer.otherRecoveries));
  const total = roundToTwoDecimals(landConversionFee + podi + recovery);

  return {
    farmerId: farmer.id,
    farmerName: farmer.farmerName,
    surveyNo: farmer.surveyNo || "",
    acres,
    guntas: gunta,
    rtcAcre: farmer.rtcExtentAcre,
    rtcGunta: farmer.rtcExtentGunta,
    leaseAcre: farmer.leaseExtentAcre,
    leaseGunta: farmer.leaseExtentGunta,
    landConversionChallanRefNo: "",
    landConversionFee,
    podiChallanRefNo: "",
    podiFee: podi,
    recoveryChallanRefNo: "",
    recoveryFee: recovery,
    total,
    remarks: "",
    changedFarmerName: farmer.changedFarmerName ?? "",
    vendorCode: farmer.vendorCode ?? "",
    newSurveyNo: farmer.newSurveyNo ?? "",
    balanceAcre: farmer.balanceExtentAcre ?? null,
    balanceGunta: farmer.balanceExtentGunta ?? null,
    rtcAKharab: farmer.rtcAKharab ?? null,
    rtcBKharab: farmer.rtcBKharab ?? null,
    totalGunta: derived.totalGunta,
    totalCents: derived.totalCents,
  };
}

/** Build an ATL & POA/GPA debit note row from farmer master. */
export function buildAtlPoaRowFromFarmer(
  farmer: DebitNoteFarmerMaster,
  ratePerAcre = 0,
): AtlPoaRow {
  const atlCharges = resolveFeeFromMasterOrRate(farmer.atlTotal, farmer, ratePerAcre);
  const poaCharges = roundToTwoDecimals(parseAsZero(farmer.paoTotal));
  const chequeAmount = roundToTwoDecimals(parseAsZero(farmer.aesAdvanceChequeAmount));
  const cashAmount = 0;
  const total = roundToTwoDecimals(atlCharges + poaCharges + chequeAmount + cashAmount);

  return {
    farmerId: farmer.id,
    farmerName: farmer.farmerName,
    surveyNo: farmer.surveyNo || "",
    rtcAcre: farmer.rtcExtentAcre,
    rtcGunta: farmer.rtcExtentGunta,
    leaseAcre: farmer.leaseExtentAcre,
    leaseGunta: farmer.leaseExtentGunta,
    atlCharges,
    poaCharges,
    chequeNo: farmer.aesAdvanceChequeNo?.trim() ?? "",
    chequeDate: farmer.aesAdvanceDate?.trim() ?? "",
    chequeAmount,
    bankName: farmer.aesAdvanceBankName?.trim() ?? "",
    cashAmount,
    total,
    remarks: "",
  };
}

/** Build a K2 challan row (service order / lease deed) from farmer master. */
export function buildK2ChallanRowFromFarmer(
  farmer: DebitNoteFarmerMaster,
  ratePerAcre = 0,
): LandConversionRow {
  const derived = computeFarmerDerivedFields({
    leaseExtentAcre: farmer.leaseExtentAcre,
    leaseExtentGunta: farmer.leaseExtentGunta,
  });
  const { acres, gunta } = resolveLeaseExtent(farmer);
  const fee = resolveK2ChallanFee(farmer, ratePerAcre);

  return {
    farmerId: farmer.id,
    farmerName: farmer.farmerName,
    surveyNo: farmer.surveyNo || "",
    acres,
    guntas: gunta,
    rtcAcre: farmer.rtcExtentAcre,
    rtcGunta: farmer.rtcExtentGunta,
    leaseAcre: farmer.leaseExtentAcre,
    leaseGunta: farmer.leaseExtentGunta,
    landConversionChallanRefNo: "",
    landConversionFee: fee,
    podiChallanRefNo: "",
    podiFee: 0,
    recoveryChallanRefNo: "",
    recoveryFee: 0,
    total: fee,
    remarks: "",
    changedFarmerName: farmer.changedFarmerName ?? "",
    vendorCode: farmer.vendorCode ?? "",
    newSurveyNo: farmer.newSurveyNo ?? "",
    balanceAcre: farmer.balanceExtentAcre ?? null,
    balanceGunta: farmer.balanceExtentGunta ?? null,
    rtcAKharab: farmer.rtcAKharab ?? null,
    rtcBKharab: farmer.rtcBKharab ?? null,
    totalGunta: derived.totalGunta,
    totalCents: derived.totalCents,
  };
}

export function formatReadOnlyTotalCents(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatTotalCents(value) || "—";
}

/** Per-row K2 fee (stored in landConversionFee). */
export function k2RowFee(row: LandConversionRow): number {
  return row.landConversionFee || 0;
}
