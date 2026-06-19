/** Karnataka land units: 1 acre = 40 guntas; 1 acre = 100 cents. */
export const GUNTAS_PER_ACRE = 40;
export const CENTS_PER_ACRE = 100;

export type ExtentInput = {
  acre?: string | number | null;
  gunta?: string | number | null;
};

export type FarmerTotalsInput = {
  rtcExtentAcre?: string | number | null;
  rtcExtentGunta?: string | number | null;
  balanceExtentAcre?: string | number | null;
  balanceExtentGunta?: string | number | null;
  leaseExtentAcre?: string | number | null;
  leaseExtentGunta?: string | number | null;
  rentPerAcre?: string | number | null;
};

function parseOptionalNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim().replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Convert acre + gunta to total guntas; null when both inputs are empty. */
export function extentToGunta(acre: number | null, gunta: number | null): number | null {
  if (acre == null && gunta == null) return null;
  return (acre ?? 0) * GUNTAS_PER_ACRE + (gunta ?? 0);
}

/** Convert acre + gunta to decimal acres; null when both inputs are empty. */
export function extentToAcres(acre: number | null, gunta: number | null): number | null {
  const totalGunta = extentToGunta(acre, gunta);
  if (totalGunta == null) return null;
  return totalGunta / GUNTAS_PER_ACRE;
}

/** Sum guntas from RTC, balance, and lease extents. */
export function computeTotalGunta(input: FarmerTotalsInput): number | null {
  const parts = [
    extentToGunta(
      parseOptionalNumber(input.rtcExtentAcre),
      parseOptionalNumber(input.rtcExtentGunta),
    ),
    extentToGunta(
      parseOptionalNumber(input.balanceExtentAcre),
      parseOptionalNumber(input.balanceExtentGunta),
    ),
    extentToGunta(
      parseOptionalNumber(input.leaseExtentAcre),
      parseOptionalNumber(input.leaseExtentGunta),
    ),
  ].filter((v): v is number => v != null);

  if (parts.length === 0) return null;
  return parts.reduce((sum, v) => sum + v, 0);
}

/** Total cents from RTC and lease extents only. */
export function computeTotalCents(input: FarmerTotalsInput): number | null {
  const parts = [
    extentToAcres(
      parseOptionalNumber(input.rtcExtentAcre),
      parseOptionalNumber(input.rtcExtentGunta),
    ),
    extentToAcres(
      parseOptionalNumber(input.leaseExtentAcre),
      parseOptionalNumber(input.leaseExtentGunta),
    ),
  ].filter((v): v is number => v != null);

  if (parts.length === 0) return null;
  const totalAcres = parts.reduce((sum, v) => sum + v, 0);
  return totalAcres * CENTS_PER_ACRE;
}

/** Total rent = rent per acre × combined extent acres when both are available. */
export function computeTotalRent(input: FarmerTotalsInput): number | null {
  const rate = parseOptionalNumber(input.rentPerAcre);
  if (rate == null) return null;

  const acreParts = [
    extentToAcres(
      parseOptionalNumber(input.rtcExtentAcre),
      parseOptionalNumber(input.rtcExtentGunta),
    ),
    extentToAcres(
      parseOptionalNumber(input.balanceExtentAcre),
      parseOptionalNumber(input.balanceExtentGunta),
    ),
    extentToAcres(
      parseOptionalNumber(input.leaseExtentAcre),
      parseOptionalNumber(input.leaseExtentGunta),
    ),
  ].filter((v): v is number => v != null);

  if (acreParts.length === 0) return null;
  const totalAcres = acreParts.reduce((sum, v) => sum + v, 0);
  return totalAcres * rate;
}

export type ShortageTotalsInput = {
  shortageChequeAmount?: string | number | null;
  shortageAmountSecondTime?: string | number | null;
  shortageThirdChequeAmount?: string | number | null;
};

/** Sum of first, second, and third shortage cheque amounts. */
export function computeShortageAmountTotal(input: ShortageTotalsInput): number | null {
  const parts = [
    parseOptionalNumber(input.shortageChequeAmount),
    parseOptionalNumber(input.shortageAmountSecondTime),
    parseOptionalNumber(input.shortageThirdChequeAmount),
  ].filter((v): v is number => v != null);

  if (parts.length === 0) return null;
  return parts.reduce((sum, v) => sum + v, 0);
}

export function formatComputedTotal(value: number | null): string {
  if (value == null) return "";
  return String(Math.round(value * 100) / 100);
}
