import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

/** Single-line centered company address footer for invoices and debit notes. */
export function CompanyDocumentFooter({ className, compact = false }: Props) {
  return (
    <footer
      className={cn(
        "border-t border-[#6ab04c] pt-2 text-center text-[#111827] whitespace-nowrap",
        compact ? "text-[6.5px]" : "text-[7px]",
        className,
      )}
    >
      <p className="overflow-hidden text-ellipsis">{COMPANY_INVOICE_HEADER.footerAddress}</p>
    </footer>
  );
}
