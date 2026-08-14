import { formatInvoiceMoney } from "@/lib/invoice-calculations";
import { CompanyBrandHeader } from "@/components/company-brand-header";
import { CompanyDocumentFooter } from "@/components/company-document-footer";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import {
  formatInvoiceLocationLine,
  hasInvoiceLocation,
  locationFromCustomer,
} from "@/lib/invoice-location";
import { formatQuotationDateDisplay } from "@/lib/quotation-calculations";
import type { QuotationDocument } from "@/lib/quotation-types";

type Props = {
  data: QuotationDocument;
};

export function QuotationTemplate({ data }: Props) {
  const subtotalLabel = formatInvoiceMoney(data.totals.subtotal);
  const location = locationFromCustomer({
    village: data.village,
    hobbli: data.hobbli,
    taluk: data.taluk,
    district: data.district,
    state: data.state,
  });
  const locationLine = formatInvoiceLocationLine(location);

  return (
    <article className="mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white p-8 text-[13px] leading-relaxed text-[#111827] shadow-sm">
      <CompanyBrandHeader documentTitle="" showDocumentTitle={false} />

      <div className="mt-4 flex justify-between text-[13px]">
        <span>Ref. No. {data.refNo}</span>
        <span>Reference Date: {formatQuotationDateDisplay(data.referenceDate)}</span>
      </div>

      <section className="mt-6 grid grid-cols-[1fr_auto] gap-6 text-[13px]">
        <div>
          <p>To,</p>
          <p className="mt-2 font-semibold">{data.customerName}</p>
          <p className="mt-1 whitespace-pre-wrap">{data.customerAddress}</p>
          {data.customerGst ? <p className="mt-1">GST: {data.customerGst}</p> : null}
        </div>
        <p className="self-start text-right">
          Quotation Date: {formatQuotationDateDisplay(data.quotationDate)}
        </p>
      </section>

      {hasInvoiceLocation(location) ? (
        <p className="mt-4 text-[12px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
          {locationLine}
        </p>
      ) : null}

      <p className="mt-6 text-[13px] font-bold">
        Subject – Quotation for {data.subject}
      </p>

      <table className="mt-6 w-full border-collapse border border-[#111827] text-[13px]">
        <thead>
          <tr>
            <th className="border border-[#111827] px-3 py-2.5 text-center w-14">Sl No</th>
            <th className="border border-[#111827] px-3 py-2.5 text-left">Description</th>
            <th className="border border-[#111827] px-3 py-2.5 text-right w-32">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={item.id}>
              <td className="border border-[#111827] px-3 py-2.5 text-center">{index + 1}</td>
              <td className="border border-[#111827] px-3 py-2.5">{item.description}</td>
              <td className="border border-[#111827] px-3 py-2.5 text-right tabular-nums">
                {formatInvoiceMoney(item.amount)}
              </td>
            </tr>
          ))}
          <tr>
            <td className="border border-[#111827] px-3 py-2.5" />
            <td className="border border-[#111827] px-3 py-2.5 text-right font-semibold">Total</td>
            <td className="border border-[#111827] px-3 py-2.5 text-right tabular-nums">
              {formatInvoiceMoney(data.totals.subtotal)}
            </td>
          </tr>
          <tr>
            <td className="border border-[#111827] px-3 py-2.5" />
            <td className="border border-[#111827] px-3 py-2.5 text-right">
              SGST 9% on {subtotalLabel}
            </td>
            <td className="border border-[#111827] px-3 py-2.5 text-right tabular-nums">
              {formatInvoiceMoney(data.totals.sgst)}
            </td>
          </tr>
          <tr>
            <td className="border border-[#111827] px-3 py-2.5" />
            <td className="border border-[#111827] px-3 py-2.5 text-right">
              CGST 9% on {subtotalLabel}
            </td>
            <td className="border border-[#111827] px-3 py-2.5 text-right tabular-nums">
              {formatInvoiceMoney(data.totals.cgst)}
            </td>
          </tr>
          <tr>
            <td className="border border-[#111827] px-3 py-2.5" />
            <td className="border border-[#111827] px-3 py-2.5 text-right font-bold">Grand Total</td>
            <td className="border border-[#111827] px-3 py-2.5 text-right font-bold tabular-nums">
              {formatInvoiceMoney(data.totals.grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-8 rounded border border-[#111827] p-4 text-[13px]">
        <p className="font-bold">Grand Total In Words</p>
        <p className="mt-2">{data.grandTotalInWords}</p>
      </div>

      <div className="mt-auto pt-16 text-right text-[13px]">
        <p>For {COMPANY_INVOICE_HEADER.signatureName}</p>
        <p className="mt-8">Authorized Signatory</p>
      </div>

      <CompanyDocumentFooter className="mt-8 shrink-0" />
    </article>
  );
}
