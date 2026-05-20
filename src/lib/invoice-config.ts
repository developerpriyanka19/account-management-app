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

export type NaInvoiceSubtypeConfig = {
  amountColumnTitle: string;
  defaultRatePerAcre: number;
  hsnSaacCode: string;
};

/** NA invoice PDF table — dynamic amount column, rate, and HSN per subtype. */
export const NA_INVOICE_SUBTYPE_CONFIG: Record<string, NaInvoiceSubtypeConfig> = {
  "Deputy Commissioner": {
    amountColumnTitle: "Deputy Comm.Office Completion",
    defaultRatePerAcre: 20_000,
    hsnSaacCode: "998314",
  },
  "Assistant Commissioner": {
    amountColumnTitle: "Assist Comm.Office Completion",
    defaultRatePerAcre: 30_000,
    hsnSaacCode: "998314",
  },
  "NA Final Order": {
    amountColumnTitle: "NA Final Order Receipt",
    defaultRatePerAcre: 10_000,
    hsnSaacCode: "998314",
  },
  "Filing NA Application": {
    amountColumnTitle: "Filing NA Application",
    defaultRatePerAcre: 15_000,
    hsnSaacCode: "998314",
  },
  "Tahsildar Completion": {
    amountColumnTitle: "NA Application completion at Tahsildar office",
    defaultRatePerAcre: 12_000,
    hsnSaacCode: "998314",
  },
};

export function getNaInvoiceSubtypeConfig(subType: string): NaInvoiceSubtypeConfig {
  return (
    NA_INVOICE_SUBTYPE_CONFIG[subType] ?? {
      amountColumnTitle: subType || "Amount",
      defaultRatePerAcre: 10_000,
      hsnSaacCode: "998314",
    }
  );
}

export function getSubtypesForCategory(category: InvoiceCategory): readonly string[] {
  return category === "na" ? NA_INVOICE_SUBTYPES : SERVICE_INVOICE_SUBTYPES;
}

export function defaultSubtypeForCategory(category: InvoiceCategory): string {
  return getSubtypesForCategory(category)[0]!;
}

/** Issuing company — static on all NA invoice PDFs. */
export const COMPANY_INVOICE_HEADER = {
  name: "AES APOORVA ENERGY SOLUTIONS",
  gstin: "29AUPJ5095P1ZC",
  signatureName: "Apoorva Energy Solutions",
  footerAddress:
    "#90, 4th Cross, Laxmi Nagar, Gokul Road, HUBBALLI - 580 030, Karnataka",
  phone: "Mobile: +91-9160 37152",
} as const;
