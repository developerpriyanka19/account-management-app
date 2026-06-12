import Image from "next/image";
import {
  COMPANY_BRAND_STYLE,
  COMPANY_INVOICE_HEADER,
  INVOICE_LOGO,
} from "@/lib/invoice-config";
import { cn } from "@/lib/utils";

type Props = {
  documentTitle: string;
  documentSubtitle?: string;
  compact?: boolean;
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
}: Props) {
  const logoH = compact ? 45 : INVOICE_LOGO.heightPx;
  const nameSize = compact ? "text-[22px]" : "text-[28px]";
  const titleSize = compact ? "text-sm" : "text-[15px]";

  return (
    <div className="w-full" style={{ marginBottom: INVOICE_LOGO.metadataMarginPx }}>
      <div
        className="relative flex w-full items-center"
        style={{ minHeight: logoH, paddingLeft: logoH + INVOICE_LOGO.gapPx }}
      >
        <Image
          src={INVOICE_LOGO.src}
          alt={COMPANY_INVOICE_HEADER.signatureName}
          width={logoH}
          height={logoH}
          className="absolute left-0 top-1/2 shrink-0 -translate-y-1/2 object-contain"
          style={{ width: logoH, height: logoH }}
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
        className="mt-2 border-0"
        style={{
          borderTopWidth: 1,
          borderTopStyle: "solid",
          borderTopColor: COMPANY_BRAND_STYLE.dividerColor,
        }}
      />
      <p
        className={cn("mt-2 text-center font-bold uppercase tracking-wide", titleSize)}
        style={{ color: COMPANY_BRAND_STYLE.titleColor }}
      >
        {documentTitle}
      </p>
      {documentSubtitle ? (
        <p className="mt-1 text-center text-[11px] font-semibold text-[#374151]">
          {documentSubtitle}
        </p>
      ) : null}
    </div>
  );
}
