import { formatInvoiceDecimal, formatInvoiceMoney, formatInvoiceTotalCents } from "@/lib/invoice-calculations";
import { buildBillToLines } from "@/lib/invoice-customer-format";
import { CompanyDocumentFooter } from "@/components/company-document-footer";
import { BankDetailsDisplay } from "@/components/bank/bank-details-display";
import { PdfPage } from "@/components/pdf/pdf-page";
import { COMPANY_INVOICE_HEADER, getServiceInvoiceSubtypeConfig } from "@/lib/invoice-config";
import { InvoiceBrandHeader } from "./invoice-brand-header";
import { InvoiceMetadataRow } from "./invoice-metadata-row";
import {
  formatServiceRatePerAcreDisplay,
  prepareServiceInvoiceDocument,
  resolveServiceHsnSacCode,
  serviceInvoiceAmountInWords,
  serviceLineAmount,
  sumServiceInvoiceExtent,
} from "@/lib/service-invoice-layout";
import {
  formatInvoiceLocationLine,
  hasInvoiceLocation,
  type InvoiceLocationFields,
} from "@/lib/invoice-location";
import type { InvoiceDocumentData } from "@/lib/invoice-types";
import { toDisplayDate } from "@/lib/date-format";

type Props = {
  data: InvoiceDocumentData;
};

const th =
  "border border-black px-0.5 py-0.5 text-center text-[10px] font-bold leading-tight text-black bg-white";
const td =
  "border border-black px-0.5 py-0.5 align-middle text-center text-[10px] leading-tight text-black break-words whitespace-normal bg-white";
const tdNum = `${td} tabular-nums whitespace-nowrap`;
const tdRight = `${td} tabular-nums whitespace-nowrap`;

function BillToBlock({ data }: { data: InvoiceDocumentData }) {
  const lines = buildBillToLines(data.customer);
  return (
    <div className="space-y-0.5 text-[10px] leading-relaxed">
      {lines.map((row, i) => {
        if (!row.value) return null;
        if (row.value === "To,") {
          return <p key={i}>To,</p>;
        }
        const isName = row.value === data.customer.companyName;
        return (
          <p
            key={i}
            className={`break-words whitespace-normal ${isName ? "font-bold" : ""}`}
          >
            {row.value}
          </p>
        );
      })}
    </div>
  );
}

/** A4 service invoice — PdfPage applies shared horizontal inset to all sections. */
export function ServiceInvoiceDocument({ data }: Props) {
  const prepared = prepareServiceInvoiceDocument(data);
  const config = getServiceInvoiceSubtypeConfig(prepared.subType);
  const rate = prepared.ratePerAcre;
  const rateLabel = formatServiceRatePerAcreDisplay(rate);
  const hsn = resolveServiceHsnSacCode(prepared);
  const rows = prepared.lines;
  const amountWords = serviceInvoiceAmountInWords(prepared);
  const { totals } = prepared;
  const labelSpan = 7;
  const extent = sumServiceInvoiceExtent(rows);

  const location: InvoiceLocationFields = {
    hobbli: prepared.hobbli?.trim() ?? "",
    village: prepared.village?.trim() ?? "",
    taluk: prepared.taluk?.trim() ?? "",
    district: prepared.district?.trim() ?? "",
    state: prepared.state?.trim() ?? "",
  };
  const locationLine = formatInvoiceLocationLine(location);

  return (
    <PdfPage
      isLastPage
      className="na-invoice-a4 invoice-print-area mx-auto box-border w-[210mm] max-w-full bg-white py-[8mm] font-serif text-[10px] text-black shadow-md print:shadow-none"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
      footer={<CompanyDocumentFooter className="na-invoice-footer border-0 pt-0" />}
      header={
        <>
          <header className="border-b border-[#9ACA66] pb-2">
            <InvoiceBrandHeader documentTitle="SERVICE INVOICE" />
            <InvoiceMetadataRow
              invoiceNumber={prepared.invoiceNumber}
              invoiceDate={toDisplayDate(prepared.invoiceDate) || prepared.invoiceDate}
              documentType={prepared.subType}
              className="text-[10px]"
            />
          </header>
          <div className="mt-2 border-b border-black pb-2">
            <BillToBlock data={prepared} />
          </div>
          {hasInvoiceLocation(location) ? (
            <div className="mt-2 border-b border-black pb-1.5 text-[10px] font-semibold">
              <p className="break-words whitespace-normal leading-relaxed">{locationLine}</p>
            </div>
          ) : null}
        </>
      }
    >
      <div className="na-invoice-table-wrap mt-2 w-full overflow-hidden">
        <table className="w-full table-fixed border-collapse border border-black text-[10px]">
          <colgroup>
            <col style={{ width: "5.3%" }} />
            <col style={{ width: "18.9%" }} />
            <col style={{ width: "11.6%" }} />
            <col style={{ width: "7.4%" }} />
            <col style={{ width: "7.4%" }} />
            <col style={{ width: "6.3%" }} />
            <col style={{ width: "6.3%" }} />
            <col style={{ width: "8.4%" }} />
            <col style={{ width: "28.4%" }} />
          </colgroup>
          <thead>
            <tr>
              <th className={th} rowSpan={2}>
                SL NO
              </th>
              <th className={th} rowSpan={2}>
                Name Of Farmers
              </th>
              <th className={th} rowSpan={2}>
                HSN/SAC Code
              </th>
              <th className={th} rowSpan={2}>
                Syr No
              </th>
              <th className={th} rowSpan={2}>
                New Syr No
              </th>
              <th className={th} rowSpan={2}>
                Acres
              </th>
              <th className={th} rowSpan={2}>
                Guntas
              </th>
              <th className={th} rowSpan={2}>
                Total Cents
              </th>
              <th className={th}>{config.serviceName}</th>
            </tr>
            <tr>
              <th className={`${th} text-[9px] font-bold`}>{rateLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className={`${td} py-4 text-center text-[#6B7280]`}>
                  No line items
                </td>
              </tr>
            ) : (
              rows.map((line, index) => (
                <tr key={`${line.farmerId ?? "x"}-${index}`}>
                  <td className={`${tdNum} whitespace-nowrap`}>{index + 1}</td>
                  <td className={`${td} text-center break-words whitespace-normal`}>
                    {line.farmerName || line.description || "—"}
                  </td>
                  <td className={`${tdNum} whitespace-nowrap`}>{hsn || "—"}</td>
                  <td className={`${tdNum} whitespace-nowrap`}>{line.surveyNo || "—"}</td>
                  <td className={`${tdNum} whitespace-nowrap`}>{line.newSurveyNo || "—"}</td>
                  <td className={`${tdNum} whitespace-nowrap`}>
                    {line.acres != null ? formatInvoiceDecimal(line.acres) : "—"}
                  </td>
                  <td className={`${tdNum} whitespace-nowrap`}>
                    {line.gunta != null ? formatInvoiceDecimal(line.gunta) : "—"}
                  </td>
                  <td className={`${tdNum} whitespace-nowrap`}>
                    {line.totalCents != null ? formatInvoiceTotalCents(line.totalCents) : "—"}
                  </td>
                  <td className={`${tdRight} whitespace-nowrap`}>
                    {formatInvoiceMoney(serviceLineAmount(line, rate))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className={`${tdNum} font-bold`}>
                Total
              </td>
              <td className={`${tdNum} font-bold whitespace-nowrap`}>
                {formatInvoiceDecimal(extent.acres)}
              </td>
              <td className={`${tdNum} font-bold whitespace-nowrap`}>
                {formatInvoiceDecimal(extent.guntas)}
              </td>
              <td className={`${tdNum} font-bold whitespace-nowrap`}>
                {formatInvoiceTotalCents(extent.totalCents)}
              </td>
              <td className={tdNum} />
            </tr>
            <tr>
              <td colSpan={labelSpan} className="border border-black bg-white" />
              <td className={`${td} text-center font-bold`}>Sub Total</td>
              <td className={`${tdRight} font-normal`}>{formatInvoiceMoney(totals.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={labelSpan} className="border border-black bg-white" />
              <td className={`${td} text-center font-bold`}>SGST @ 9% on</td>
              <td className={`${tdRight} font-normal`}>{formatInvoiceMoney(totals.sgst)}</td>
            </tr>
            <tr>
              <td colSpan={labelSpan} className="border border-black bg-white" />
              <td className={`${td} text-center font-bold`}>CGST @ 9% on</td>
              <td className={`${tdRight} font-normal`}>{formatInvoiceMoney(totals.cgst)}</td>
            </tr>
            <tr className="bg-[#1F2937] font-bold text-white">
              <td colSpan={labelSpan} className="border border-black bg-white" />
              <td className="border border-black bg-[#1F2937] px-0.5 py-1 text-center text-[10px] font-bold text-white">
                Grand Total
              </td>
              <td className="border border-black bg-[#1F2937] px-0.5 py-1 text-center text-[10px] font-bold tabular-nums text-white">
                {formatInvoiceMoney(totals.grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-2 text-[10px] leading-snug">
        <span className="font-bold">Value of Invoice: </span>
        {amountWords}
      </p>

      <div className="mt-4 flex items-end justify-between gap-4">
        <BankDetailsDisplay bank={prepared.bank} />
        <div className="text-right text-[10px] font-normal">
          <p className="font-medium">For {COMPANY_INVOICE_HEADER.signatureName}</p>
          <p className="mt-6">Authorized Signatory</p>
        </div>
      </div>
    </PdfPage>
  );
}
