import { buildBillToLines } from "@/lib/invoice-customer-format";
import {
  formatInvoiceLocationLine,
  hasInvoiceLocation,
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
  const locationLine = formatInvoiceLocationLine(location);

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
        documentType={data.subType}
        poNumber={data.poNumber}
        poDate={data.poDate}
        compact={isService}
      />

      <div
        className={
          isService
            ? "mt-2 border-t border-[#E5E7EB] pt-2 text-left text-[11px]"
            : "mt-4 border-t border-[#E5E7EB] pt-4 text-left text-[11px]"
        }
      >
        <div>
          {billLines.map((row, i) => {
            if (!row.value) return null;
            if (row.value === "To,") {
              return <p key={i}>To,</p>;
            }
            const isName = row.value === data.customer.companyName;
            return (
              <p key={i} className={isName ? "font-semibold text-[#111827]" : "text-[#111827]"}>
                {row.value}
              </p>
            );
          })}
        </div>
      </div>

      {showLocation ? (
        <div className="mt-2 border-t border-[#E5E7EB] pt-2 text-[11px] font-semibold text-[#111827]">
          <p className="whitespace-nowrap overflow-hidden text-ellipsis">{locationLine}</p>
        </div>
      ) : null}
    </header>
  );
}
