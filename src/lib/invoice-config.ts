/** Invoice category and sub-type definitions for the template engine. */

export const NA_INVOICE_SUBTYPES = [
  "NA Final Order",
  "Filling NA Application",
  "Tahsildar Completion",
  "Assistant Commissioner",
  "Deputy Commissioner",
] as const;

export const SERVICE_INVOICE_SUBTYPES = [
  "Mutation Records",
  "Lease Deed",
  "Survey Boundary",
  "ATL & GPA",
  "Due Diligence",
  "COD",
  "Survey Order",
] as const;

export type NaInvoiceSubtype = (typeof NA_INVOICE_SUBTYPES)[number];
export type ServiceInvoiceSubtype = (typeof SERVICE_INVOICE_SUBTYPES)[number];

export type InvoiceCategory = "na" | "service";

export type NaInvoiceSubtypeConfig = {
  amountColumnTitle: string;
  defaultRatePerAcre: number;
};

/** Service invoice sub-type — add new services here only; PDF template reads these values. */
export type ServiceInvoiceSubtypeConfig = {
  serviceName: string;
  ratePerAcre: number;
};

export const DEFAULT_SERVICE_HSN_SAC_CODE = "998314" as const;

/** Map legacy subtype labels to current display keys. */
export function normalizeNaSubtype(subType: string): string {
  if (subType === "Filing NA Application") return "Filling NA Application";
  return subType;
}

/** Map legacy service subtype labels to current display keys. */
export function normalizeServiceSubtype(subType: string): string {
  if (subType === "Mutation Record") return "Mutation Records";
  if (subType === "Service Charges") return "Survey Order";
  return subType;
}

/** NA invoice PDF table — dynamic amount column and default rate per subtype. */
export const NA_INVOICE_SUBTYPE_CONFIG: Record<string, NaInvoiceSubtypeConfig> = {
  "Deputy Commissioner": {
    amountColumnTitle: "Deputy Comm.Office Completion",
    defaultRatePerAcre: 20_000,
  },
  "Assistant Commissioner": {
    amountColumnTitle: "Assist Comm.Office Completion",
    defaultRatePerAcre: 30_000,
  },
  "NA Final Order": {
    amountColumnTitle: "NA Final Order Receipt",
    defaultRatePerAcre: 10_000,
  },
  "Filling NA Application": {
    amountColumnTitle: "Filling NA Application",
    defaultRatePerAcre: 15_000,
  },
  "Tahsildar Completion": {
    amountColumnTitle: "NA Application completion at Tahsildar office",
    defaultRatePerAcre: 12_000,
  },
};

/** Service invoice — service name and rate per acre for the shared PDF template. */
export const SERVICE_INVOICE_SUBTYPE_CONFIG: Record<string, ServiceInvoiceSubtypeConfig> = {
  "Mutation Records": {
    serviceName: "Mutation Record Infavor of Company",
    ratePerAcre: 25_000,
  },
  "Lease Deed": {
    serviceName: "Execution Of Lease Deed",
    ratePerAcre: 25_000,
  },
  "Survey Boundary": {
    serviceName: "Execution Of Survey & Boundary Marking Per Acres",
    ratePerAcre: 25_000,
  },
  "ATL & GPA": {
    serviceName: "Execution Of ATL and GPA",
    ratePerAcre: 25_000,
  },
  "Due Diligence": {
    serviceName: "Land Due Diligence DD & Requisition Completion Of Any Documents",
    ratePerAcre: 25_000,
  },
  COD: {
    serviceName: "Within 30 Days COD",
    ratePerAcre: 25_000,
  },
  "Survey Order": {
    serviceName: "Execution Of Survey Order",
    ratePerAcre: 25_000,
  },
};

export function getNaInvoiceSubtypeConfig(subType: string): NaInvoiceSubtypeConfig {
  const key = normalizeNaSubtype(subType);
  return (
    NA_INVOICE_SUBTYPE_CONFIG[key] ?? {
      amountColumnTitle: key || "Amount",
      defaultRatePerAcre: 10_000,
    }
  );
}

export function getServiceInvoiceSubtypeConfig(subType: string): ServiceInvoiceSubtypeConfig {
  const key = normalizeServiceSubtype(subType);
  return (
    SERVICE_INVOICE_SUBTYPE_CONFIG[key] ?? {
      serviceName: key || "Service",
      ratePerAcre: 25_000,
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
    "Shop No - 15 and 18 Second Floor Shriya Riddhi Siddhi Chaitanya Colony Opp Giants School R.N. Shetty Road HUBBALLI 580030",
  phone: "Mobile : +91-9916037152",
  email: "Email : info@apoorvaenergysolutions.com",
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
  intrinsicWidthPx: 593,
  intrinsicHeightPx: 518,
  /** Logo display width (height scales automatically). */
  widthPx: 100,
  compactWidthPx: 80,
  /** Fixed row height — company name vertical position unchanged. */
  headerRowHeightPx: 50,
  compactHeaderRowHeightPx: 45,
  gapPx: 12,
  companyNameFontPx: 26,
  titleFontPx: 15,
  /** Space after centered document title before metadata */
  metadataMarginPx: 18,
} as const;

/** Logo height for a given display width (preserves intrinsic aspect ratio). */
export function invoiceLogoHeightPx(widthPx: number): number {
  return Math.round(
    widthPx * (INVOICE_LOGO.intrinsicHeightPx / INVOICE_LOGO.intrinsicWidthPx),
  );
}

/** Same layout in mm for jsPDF (logo width; height from aspect ratio). */
export const INVOICE_LOGO_PDF_MM = {
  logoWidth: 26.5,
  compactLogoWidth: 21.2,
  headerRowHeight: 13.2,
  gap: 3.2,
  companyFontSize: 22,
  titleFontSize: 11,
  lineWidth: 0.35,
  metadataMargin: 4.8,
  /** Reserved top margin on continuation pages (logo row + line + title). */
  repeatHeaderHeight: 36,
} as const;

/** Logo height in mm for a given display width in mm. */
export function invoiceLogoHeightMm(widthMm: number): number {
  return widthMm * (INVOICE_LOGO.intrinsicHeightPx / INVOICE_LOGO.intrinsicWidthPx);
}
