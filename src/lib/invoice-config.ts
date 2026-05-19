/** Invoice category and sub-type definitions for the template engine. */

export const NA_INVOICE_SUBTYPES = [
  "NA Final Order",
  "Filing NA Application",
  "Tahsildar Completion",
  "Assistant Commissioner",
  "Deputy Commissioner",
] as const;

export const SERVICE_INVOICE_SUBTYPES = [
  "Mutation Record",
  "Lease Deed",
  "Survey Boundary",
  "ATL & GPA",
  "Due Diligence",
  "COD",
] as const;

export type NaInvoiceSubtype = (typeof NA_INVOICE_SUBTYPES)[number];
export type ServiceInvoiceSubtype = (typeof SERVICE_INVOICE_SUBTYPES)[number];

export type InvoiceCategory = "na" | "service";

export function getSubtypesForCategory(category: InvoiceCategory): readonly string[] {
  return category === "na" ? NA_INVOICE_SUBTYPES : SERVICE_INVOICE_SUBTYPES;
}

export function defaultSubtypeForCategory(category: InvoiceCategory): string {
  return getSubtypesForCategory(category)[0]!;
}

export const COMPANY_INVOICE_HEADER = {
  name: "AES ADVISORY SERVICES",
  tagline: "Land & Revenue Advisory",
  address: "Bengaluru, Karnataka, India",
  phone: "+91 00000 00000",
  email: "accounts@aesadvisory.in",
  gstin: "29XXXXX0000X0XX",
  pan: "AABCA0000A",
} as const;
