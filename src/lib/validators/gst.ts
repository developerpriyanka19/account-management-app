/** Standard 15-character GSTIN format (India). */
export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function normalizeGstNumber(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidGstNumber(value: string): boolean {
  return GSTIN_REGEX.test(normalizeGstNumber(value));
}

/** PAN is embedded in GSTIN (characters 3–12). */
export function extractPanFromGst(gstNumber: string): string | null {
  const gst = normalizeGstNumber(gstNumber);
  if (gst.length !== 15) return null;
  return gst.slice(2, 12);
}
