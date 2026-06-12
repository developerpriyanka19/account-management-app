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
  name: "APOORVA ENERGY SOLUTIONS",
  gstin: "29AIJPJ5095P1ZC",
  signatureName: "Apoorva Energy Solutions",
  footerAddress:
    "No 15 & 18 Riddi Siddi Complex, 2nd Floor Opp Giants School, Chaitanya Colony, R N Shetty Road, Hubli - 580030",
  phone: "Mobile: +91-9160 37152",
} as const;

/** Brand header colors and typography (screen + PDF). */
export const COMPANY_BRAND_STYLE = {
  companyNameColor: "#f5821f",
  titleColor: "#111827",
  dividerColor: "#6ab04c",
} as const;

/** Logo + flex header spacing (screen). */
export const INVOICE_LOGO = {
  src: "/company-logo.png",
  /** Logo height 45–55px */
  heightPx: 50,
  gapPx: 12,
  companyNameFontPx: 26,
  titleFontPx: 15,
  /** Space after centered document title before metadata */
  metadataMarginPx: 18,
} as const;

/** Same layout in mm for jsPDF (~50px logo at 96dpi). */
export const INVOICE_LOGO_PDF_MM = {
  logoHeight: 13.2,
  gap: 3.2,
  companyFontSize: 22,
  titleFontSize: 11,
  lineWidth: 0.35,
  metadataMargin: 4.8,
  /** Reserved top margin on continuation pages (logo row + line + title). */
  repeatHeaderHeight: 30,
} as const;
