import { buildBillToLines } from "@/lib/invoice-customer-format";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
};

export function InvoiceHeader({ data }: Props) {
  const billLines = buildBillToLines(data.customer);

  return (
    <header className="border-b-2 border-[#9ACA66] pb-3 text-center">
      <h1 className="text-[32px] font-bold uppercase leading-none tracking-wide text-[#F28C2A]">
        {COMPANY_INVOICE_HEADER.name}
      </h1>
      <p className="mt-1 text-lg font-bold tracking-wide">INVOICE</p>
      <div className="mt-2 flex items-start justify-between px-1 text-[11px] text-[#374151]">
        <div className="space-y-1 text-left">
          <p>
            <span className="font-semibold text-[#6B7280]">Invoice No: </span>
            <span className="font-mono font-semibold text-[#111827]">{data.invoiceNumber}</span>
          </p>
          <p>
            <span className="font-semibold text-[#6B7280]">GST: </span>
            {COMPANY_INVOICE_HEADER.gstin}
          </p>
        </div>
        <p>
          <span className="font-semibold text-[#6B7280]">Date: </span>
          {data.invoiceDate}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-4 text-left text-[11px]">
        <div>
          {billLines.map((row, i) => {
            if (!row.label && row.value === "To,") {
              return <p key={i}>To,</p>;
            }
            if (!row.label && row.value) {
              return (
                <p key={i} className="font-semibold text-[#111827]">
                  {row.value}
                </p>
              );
            }
            if (row.label) {
              return (
                <div key={i} className="mt-0.5">
                  <p className="text-[#6B7280]">{row.label}</p>
                  {row.value ? <p className="text-[#111827]">{row.value}</p> : null}
                </div>
              );
            }
            return null;
          })}
        </div>
        <div className="text-right">
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

      <div className="mt-2 border-t border-[#E5E7EB] pt-2 text-[11px] text-[#111827]">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <p className="min-w-0">
            <span className="font-semibold text-[#6B7280]">District: </span>
            {data.district || "—"}
          </p>
          <p className="min-w-0">
            <span className="font-semibold text-[#6B7280]">Taluk: </span>
            {data.taluk || "—"}
          </p>
          <p className="min-w-0">
            <span className="font-semibold text-[#6B7280]">Village: </span>
            {data.village || "—"}
          </p>
          <p className="min-w-0">
            <span className="font-semibold text-[#6B7280]">Hobli: </span>
            {data.hobbli || "—"}
          </p>
        </div>
      </div>
    </header>
  );
}
