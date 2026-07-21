import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

/** Centered company address footer for invoices and debit notes. */
export function CompanyDocumentFooter({ className, compact = false }: Props) {
  return (
    <footer
      className={cn(
        "border-t border-[#6ab04c] pt-4 text-center leading-relaxed text-[#111827]",
        compact ? "text-[9px]" : "text-[10px]",
        className,
      )}
    >
      <p className="whitespace-normal break-words">{COMPANY_INVOICE_HEADER.footerAddress}</p>
      <p className="mt-1.5">GST No : {COMPANY_INVOICE_HEADER.gstin}</p>
      <p className="mt-1">{COMPANY_INVOICE_HEADER.phone}</p>
      <p className="mt-1">{COMPANY_INVOICE_HEADER.email}</p>
    </footer>
  );
}
