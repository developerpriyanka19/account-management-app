import { buildBillToLines } from "@/lib/invoice-customer-format";
import {
  hasInvoiceLocation,
  invoiceLocationEntries,
  type InvoiceLocationFields,
} from "@/lib/invoice-location";
import type { InvoiceDocumentData } from "@/lib/invoice-types";
import { InvoiceBrandHeader } from "./invoice-brand-header";
import { InvoiceMetadataRow } from "./invoice-metadata-row";

type Props = {
  data: InvoiceDocumentData;
  /** Tighter layout for service invoices (no type/status, less padding). */
  compact?: boolean;
};

function locationFromDocument(data: InvoiceDocumentData): InvoiceLocationFields {
  return {
    hobbli: data.hobbli?.trim() ?? "",
    village: data.village?.trim() ?? "",
    taluk: data.taluk?.trim() ?? "",
    district: data.district?.trim() ?? "",
    state: data.state?.trim() ?? "",
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
          ? "border-b-2 border-[#9ACA66] pb-2"
          : "border-b-2 border-[#9ACA66] pb-3"
      }
    >
      <InvoiceBrandHeader compact={isService} documentTitle={isService ? "SERVICE INVOICE" : "NA INVOICE"} />
      <InvoiceMetadataRow
        invoiceNumber={data.invoiceNumber}
        invoiceDate={data.invoiceDate}
        poNumber={data.poNumber}
        poDate={data.poDate}
        compact={isService}
      />

      <div
        className={
          isService
            ? "mt-2 border-t border-[#E5E7EB] pt-2 text-left text-[11px]"
            : "mt-4 grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-4 text-left text-[11px]"
        }
      >
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
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-5">
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
