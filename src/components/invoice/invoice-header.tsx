import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
};

export function InvoiceHeader({ data }: Props) {
  return (
    <header className="border-b-2 border-[#111827] pb-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">
        Tax Invoice
      </p>
      <h1 className="mt-1 text-xl font-bold uppercase text-[#111827]">
        {COMPANY_INVOICE_HEADER.name}
      </h1>
      <p className="text-xs text-[#6B7280]">{COMPANY_INVOICE_HEADER.tagline}</p>
      <p className="mt-2 text-[11px] text-[#374151]">{COMPANY_INVOICE_HEADER.address}</p>
      <p className="text-[11px] text-[#374151]">
        GSTIN: {COMPANY_INVOICE_HEADER.gstin} · PAN: {COMPANY_INVOICE_HEADER.pan}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-4 text-left text-[11px]">
        <div>
          <p className="font-semibold uppercase text-[#6B7280]">Bill To</p>
          <p className="mt-1 font-semibold text-[#111827]">{data.customer.companyName}</p>
          <p className="mt-1 whitespace-pre-wrap text-[#374151]">{data.customer.companyAddress}</p>
          <p className="mt-1">GSTIN: {data.customer.gstNumber}</p>
          {data.customer.state ? <p>State: {data.customer.state}</p> : null}
          {data.customer.panNumber ? <p>PAN: {data.customer.panNumber}</p> : null}
        </div>
        <div className="text-right">
          <p>
            <span className="font-semibold text-[#6B7280]">Invoice No: </span>
            <span className="font-mono font-semibold text-[#111827]">{data.invoiceNumber}</span>
          </p>
          <p className="mt-1">
            <span className="font-semibold text-[#6B7280]">Date: </span>
            {data.invoiceDate}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-[#6B7280]">Type: </span>
            {data.subType}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-[#6B7280]">Status: </span>
            <span className="capitalize">{data.status}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
