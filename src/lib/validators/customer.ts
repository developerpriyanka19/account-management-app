import { z } from "zod";
import { isValidGstNumber, normalizeGstNumber } from "@/lib/validators/gst";

/** GSTIN required in DB; format validated when entered. */
const gstNumberSchema = z
  .string()
  .transform((v) => normalizeGstNumber(v))
  .refine((v) => v.length > 0, "GST number is required.")
  .refine((v) => isValidGstNumber(v), "Enter a valid 15-digit GST number.");

export const customerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  gstNumber: gstNumberSchema,
  companyName: z.string(),
  companyAddress: z.string(),
  state: z.string(),
  gstStatus: z.string(),
  panNumber: z.string(),
  mobile: z
    .string()
    .refine((v) => !v.trim() || /^[0-9+\-\s()]{7,15}$/.test(v.trim()), "Enter a valid mobile number."),
  email: z
    .string()
    .refine(
      (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      "Enter a valid email address.",
    ),
  notes: z.string(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const emptyCustomerFormValues: CustomerFormValues = {
  firstName: "",
  lastName: "",
  gstNumber: "",
  companyName: "",
  companyAddress: "",
  state: "",
  gstStatus: "",
  panNumber: "",
  mobile: "",
  email: "",
  notes: "",
};

export function parseCustomerFormValues(
  values: CustomerFormValues,
):
  | { ok: true; data: CustomerFormValues }
  | { ok: false; fieldErrors: Record<string, string>; message?: string } {
  const result = customerFormSchema.safeParse(values);
  if (result.success) {
    const data = result.data;
    return {
      ok: true,
      data: {
        ...data,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        gstNumber: data.gstNumber,
        companyName: data.companyName.trim(),
        companyAddress: data.companyAddress.trim(),
        state: data.state.trim(),
        gstStatus: data.gstStatus.trim(),
        panNumber: data.panNumber.trim().toUpperCase(),
        mobile: data.mobile.trim(),
        email: data.email.trim(),
        notes: data.notes.trim(),
      },
    };
  }

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return { ok: false, fieldErrors };
}
