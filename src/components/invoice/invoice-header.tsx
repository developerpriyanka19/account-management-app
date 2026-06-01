import { buildBillToLines } from "@/lib/invoice-customer-format";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import {
  hasInvoiceLocation,
  invoiceLocationEntries,
  type InvoiceLocationFields,
} from "@/lib/invoice-location";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
  /** Tighter layout for service invoices (no type/status, less padding). */
  compact?: boolean;
};

function locationFromDocument(data: InvoiceDocumentData): InvoiceLocationFields {
  return {
    district: data.district?.trim() ?? "",
    taluk: data.taluk?.trim() ?? "",
    village: data.village?.trim() ?? "",
    hobbli: data.hobbli?.trim() ?? "",
  };
}

export function InvoiceHeader({ data, compact = false }: Props) {
  const billLines = buildBillToLines(data.customer);
  const isService = data.invoiceType === "service" || compact;
  const location = locationFromDocument(data);
  const showLocation = hasInvoiceLocation(location);
  const locationItems = invoiceLocationEntries(location);

  return (
    <header
      className={
        isService
          ? "border-b-2 border-[#9ACA66] pb-2 text-center"
          : "border-b-2 border-[#9ACA66] pb-3 text-center"
      }
    >
      <h1
        className={
          isService
            ? "text-[28px] font-bold uppercase leading-none tracking-wide text-[#F28C2A]"
            : "text-[32px] font-bold uppercase leading-none tracking-wide text-[#F28C2A]"
        }
      >
        {COMPANY_INVOICE_HEADER.name}
      </h1>
      <p className={isService ? "mt-0.5 text-base font-bold tracking-wide" : "mt-1 text-lg font-bold tracking-wide"}>
        INVOICE
      </p>
      <div
        className={
          isService
            ? "mt-1.5 flex items-start justify-between px-1 text-[11px] text-[#374151]"
            : "mt-2 flex items-start justify-between px-1 text-[11px] text-[#374151]"
        }
      >
        <div className="space-y-0.5 text-left">
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

      <div
        className={
          isService
            ? "mt-2 border-t border-[#E5E7EB] pt-2 text-left text-[11px]"
            : "mt-4 grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-4 text-left text-[11px]"
        }
      >
        <div className={isService ? "" : ""}>
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
        {!isService ? (
          <div className="text-right">
            <p className="mt-1">
              <span className="font-semibold text-[#6B7280]">Type: </span>
              {data.subType}
            </p>
          </div>
        ) : null}
      </div>

      {showLocation ? (
        <div className="mt-2 border-t border-[#E5E7EB] pt-2 text-[11px] text-[#111827]">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {locationItems.map(({ label, value }) => (
              <p key={label} className="min-w-0">
                <span className="font-semibold text-[#6B7280]">{label}: </span>
                {value}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
