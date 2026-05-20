import { buildBillToLines } from "@/lib/invoice-customer-format";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
};

export function InvoiceHeader({ data }: Props) {
  const billLines = buildBillToLines(data.customer);

  return (
    <header className="border-b-2 border-[#111827] pb-4 text-center">
      <h1 className="text-xl font-bold uppercase text-[#111827]">
        {COMPANY_INVOICE_HEADER.name}
      </h1>
      <p className="mt-1 text-base font-bold tracking-wide">INVOICE</p>
      <div className="mt-2 flex justify-between px-1 text-[11px] text-[#374151]">
        <p>GSTIN: {COMPANY_INVOICE_HEADER.gstin}</p>
        <p>Date: {data.invoiceDate}</p>
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
          <p>
            <span className="font-semibold text-[#6B7280]">Invoice No: </span>
            <span className="font-mono font-semibold text-[#111827]">{data.invoiceNumber}</span>
          </p>
          <p className="mt-1">
            <span className="font-semibold text-[#6B7280]">District: </span>
            {data.district || "—"}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-[#6B7280]">Taluk: </span>
            {data.taluk || "—"}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-[#6B7280]">Village: </span>
            {data.village || "—"}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-[#6B7280]">Hobbli: </span>
            {data.hobbli || "—"}
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
