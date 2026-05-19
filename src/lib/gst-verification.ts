/**
 * GST verification (external API) — not used yet.
 *
 * TODO: When enabling GST auto-fetch:
 * - Add `lib/gst.ts` with `fetchGstDetailsFromProvider(gstNumber)`
 * - Add `app/api/gst/route.ts` (POST) and optional duplicate-check route
 * - Wire `CustomerForm` “Fetch details” button to the API
 * - Configure env: GST_API_KEY (and optional GST_API_URL)
 */

export type GstVerificationResult = {
  companyName: string;
  companyAddress: string;
  state: string;
  gstStatus: string;
  panNumber: string;
};

/** Placeholder for future GST provider integration. */
export async function fetchGstDetailsFromProvider(
  _gstNumber: string,
): Promise<GstVerificationResult> {
  throw new Error("GST verification is not enabled.");
}
