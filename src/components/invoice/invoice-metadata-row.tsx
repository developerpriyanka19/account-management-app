import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import { cn } from "@/lib/utils";

type Props = {
  invoiceNumber: string;
  invoiceDate: string;
  documentType?: string;
  poNumber?: string;
  poDate?: string;
  compact?: boolean;
  className?: string;
};

export function InvoiceMetadataRow({
  invoiceNumber,
  invoiceDate,
  documentType,
  poNumber,
  poDate,
  compact = false,
  className,
}: Props) {
  const hasPo = Boolean(poNumber?.trim() || poDate?.trim());

  return (
    <div
      className={cn(
        "flex items-start justify-between text-[#374151]",
        compact ? "px-1 text-[11px]" : "px-1 text-[11px]",
        className,
      )}
    >
      <div className="space-y-0.5 text-left">
        <p>
          <span className="font-semibold text-[#6B7280]">Invoice No: </span>
          <span className="font-mono font-semibold text-[#111827]">{invoiceNumber}</span>
        </p>
        <p>
          <span className="font-semibold text-[#6B7280]">GST: </span>
          {COMPANY_INVOICE_HEADER.gstin}
        </p>
        {hasPo && poNumber?.trim() ? (
          <p>
            <span className="font-semibold text-[#6B7280]">P.O No: </span>
            {poNumber.trim()}
          </p>
        ) : null}
      </div>
      <div className="space-y-0.5 text-right">
        {documentType ? (
          <p>
            <span className="font-semibold text-[#6B7280]">Type: </span>
            {documentType}
          </p>
        ) : null}
        <p>
          <span className="font-semibold text-[#6B7280]">Date: </span>
          {invoiceDate}
        </p>
        {hasPo && poDate?.trim() ? (
          <p>
            <span className="font-semibold text-[#6B7280]">P.O Date: </span>
            {poDate.trim()}
          </p>
        ) : null}
      </div>
    </div>
  );
}
