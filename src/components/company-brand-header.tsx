import Image from "next/image";
import {
  COMPANY_BRAND_STYLE,
  COMPANY_INVOICE_HEADER,
  INVOICE_LOGO,
  invoiceLogoHeightPx,
} from "@/lib/invoice-config";
import { cn } from "@/lib/utils";

type Props = {
  documentTitle: string;
  documentSubtitle?: string;
  compact?: boolean;
  /** When false, only logo + company name + green line (quotation style). */
  showDocumentTitle?: boolean;
};

/**
 * [Logo]     APOORVA ENERGY SOLUTIONS (page-centered)
 * ───────────── green line ─────────────
 *           INVOICE / DEBIT NOTE
 */
export function CompanyBrandHeader({
  documentTitle,
  documentSubtitle,
  compact = false,
  showDocumentTitle = true,
}: Props) {
  const logoW = compact ? INVOICE_LOGO.compactWidthPx : INVOICE_LOGO.widthPx;
  const logoH = invoiceLogoHeightPx(logoW);
  const headerRowH = compact
    ? INVOICE_LOGO.compactHeaderRowHeightPx
    : INVOICE_LOGO.headerRowHeightPx;
  const headerBlockH = Math.max(headerRowH, logoH);
  const nameSize = compact ? "text-[22px]" : "text-[28px]";
  const titleSize = compact ? "text-sm" : "text-[15px]";

  return (
    <div className="w-full" style={{ marginBottom: INVOICE_LOGO.metadataMarginPx }}>
      <div
        className="relative flex w-full items-center"
        style={{
          minHeight: headerBlockH,
          paddingLeft: logoW + INVOICE_LOGO.gapPx,
        }}
      >
        <Image
          src={INVOICE_LOGO.src}
          alt={COMPANY_INVOICE_HEADER.signatureName}
          width={INVOICE_LOGO.intrinsicWidthPx}
          height={INVOICE_LOGO.intrinsicHeightPx}
          className="absolute left-0 top-0 shrink-0 object-contain object-left-top"
          style={{ width: logoW, height: "auto" }}
          priority
        />
        <h1
          className={cn(
            "w-full text-center font-bold uppercase leading-tight tracking-wide",
            nameSize,
          )}
          style={{ color: COMPANY_BRAND_STYLE.companyNameColor }}
        >
          {COMPANY_INVOICE_HEADER.name}
        </h1>
      </div>
      <hr
        className="border-0"
        style={{
          marginTop: 6,
          borderTopWidth: 1,
          borderTopStyle: "solid",
          borderTopColor: COMPANY_BRAND_STYLE.dividerColor,
        }}
      />
      {showDocumentTitle ? (
        <p
          className={cn("mt-2 text-center font-bold uppercase tracking-wide", titleSize)}
          style={{ color: COMPANY_BRAND_STYLE.titleColor }}
        >
          {documentTitle}
        </p>
      ) : null}
      {documentSubtitle ? (
        <p className="mt-1 text-center text-[11px] font-semibold text-[#374151]">
          {documentSubtitle}
        </p>
      ) : null}
    </div>
  );
}
