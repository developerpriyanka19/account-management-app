import Image from "next/image";
import { COMPANY_INVOICE_HEADER, INVOICE_LOGO } from "@/lib/invoice-config";
import { cn } from "@/lib/utils";

type Props = {
  compact?: boolean;
};

/** Logo left + company name / INVOICE stack right, with gap and bottom margin before metadata. */
export function InvoiceBrandHeader({ compact = false }: Props) {
  return (
    <div
      className="flex items-center gap-4"
      style={{ marginBottom: INVOICE_LOGO.metadataMarginPx }}
    >
      <Image
        src={INVOICE_LOGO.src}
        alt={COMPANY_INVOICE_HEADER.signatureName}
        width={INVOICE_LOGO.sizePx}
        height={INVOICE_LOGO.sizePx}
        className="h-20 w-20 shrink-0 object-contain"
        priority
      />
      <div className="min-w-0 text-left">
        <h1
          className={cn(
            "font-bold uppercase leading-none tracking-wide text-[#F28C2A]",
            compact ? "text-[28px]" : "text-[32px]",
          )}
        >
          {COMPANY_INVOICE_HEADER.name}
        </h1>
        <p
          className={cn(
            "font-bold tracking-wide text-black",
            compact ? "mt-0.5 text-base" : "mt-1 text-lg",
          )}
        >
          INVOICE
        </p>
      </div>
    </div>
  );
}
