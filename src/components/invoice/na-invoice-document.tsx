import { formatInvoiceDecimal, formatInvoiceMoney, formatInvoiceTotalCents } from "@/lib/invoice-calculations";
import { buildBillToLines } from "@/lib/invoice-customer-format";
import { CompanyDocumentFooter } from "@/components/company-document-footer";
import { BankDetailsDisplay } from "@/components/bank/bank-details-display";
import { PdfPage } from "@/components/pdf/pdf-page";
import { COMPANY_INVOICE_HEADER, getNaInvoiceSubtypeConfig } from "@/lib/invoice-config";
import { toDisplayDate } from "@/lib/date-format";
import { InvoiceBrandHeader } from "./invoice-brand-header";
import { InvoiceMetadataRow } from "./invoice-metadata-row";
import {
  formatRatePerAcreDisplay,
  naInvoiceAmountInWords,
  naLineAmount,
  prepareNaInvoiceDocument,
  resolveNaHsnSacCode,
  resolveNaRatePerAcre,
} from "@/lib/na-invoice-layout";
import {
  formatInvoiceLocationLine,
  hasInvoiceLocation,
  type InvoiceLocationFields,
} from "@/lib/invoice-location";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
};

const th =
  "border border-black px-0.5 py-0.5 text-center text-[8px] font-bold leading-tight text-black bg-white";
const td =
  "border border-black px-0.5 py-0.5 align-middle text-[7px] leading-tight text-black break-words bg-white";
const tdNum = `${td} text-center tabular-nums`;
const tdRight = `${td} text-right tabular-nums`;

function BillToBlock({ data }: { data: InvoiceDocumentData }) {
  const lines = buildBillToLines(data.customer);
  return (
    <div className="text-[7px] leading-snug">
      {lines.map((row, i) => {
        if (!row.value) return null;
        if (row.value === "To,") {
          return <p key={i}>To,</p>;
        }
        const isName = row.value === data.customer.companyName;
        return (
          <p key={i} className={isName ? "font-bold" : undefined}>
            {row.value}
          </p>
        );
      })}
    </div>
  );
}

/**
 * A4 NA tax invoice — matches approved PDF table structure (no horizontal scroll).
 */
export function NaInvoiceDocument({ data }: Props) {
  const prepared = prepareNaInvoiceDocument(data);
  const config = getNaInvoiceSubtypeConfig(prepared.subType);
  const rate = resolveNaRatePerAcre(prepared);
  const rateLabel = formatRatePerAcreDisplay(rate);
  const hsn = resolveNaHsnSacCode(prepared);
  const rows = prepared.lines;
  const amountWords = naInvoiceAmountInWords(prepared);
  const { totals } = prepared;
  const location: InvoiceLocationFields = {
    hobbli: prepared.hobbli?.trim() ?? "",
    village: prepared.village?.trim() ?? "",
    taluk: prepared.taluk?.trim() ?? "",
    district: prepared.district?.trim() ?? "",
    state: prepared.state?.trim() ?? "",
  };
  const locationLine = formatInvoiceLocationLine(location);
  const poDateDisplay = toDisplayDate(prepared.poDate) || "";

  return (
    <PdfPage
      isLastPage
      className="na-invoice-a4 invoice-print-area mx-auto box-border w-[210mm] max-w-full bg-white px-[10mm] py-[10mm] font-serif text-black shadow-md print:shadow-none"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
      header={
        <>
          <header className="border-b border-[#9ACA66] pb-2">
            <InvoiceBrandHeader documentTitle="NA INVOICE" />
            <InvoiceMetadataRow
              invoiceNumber={prepared.invoiceNumber}
              invoiceDate={toDisplayDate(prepared.invoiceDate) || prepared.invoiceDate}
              documentType={prepared.subType}
              poNumber={prepared.poNumber}
              poDate={poDateDisplay}
              className="text-[8px]"
            />
          </header>

          <div className="mt-2 border-b border-black pb-2">
            <BillToBlock data={prepared} />
          </div>
          {hasInvoiceLocation(location) ? (
            <div className="mt-1 border-b border-black pb-1 text-[7px] font-semibold">
              <p className="whitespace-nowrap overflow-hidden text-ellipsis">{locationLine}</p>
            </div>
          ) : null}
        </>
      }
      footer={<CompanyDocumentFooter className="na-invoice-footer border-0 pt-0" />}
    >
      <div className="na-invoice-table-wrap mt-2 w-full overflow-hidden">
        <table className="w-full table-fixed border-collapse border border-black text-[7px]">
          <colgroup>
            <col style={{ width: "5.3%" }} />
            <col style={{ width: "13.2%" }} />
            <col style={{ width: "9.5%" }} />
            <col style={{ width: "7.4%" }} />
            <col style={{ width: "6.3%" }} />
            <col style={{ width: "6.3%" }} />
            <col style={{ width: "9.5%" }} />
            <col style={{ width: "9.5%" }} />
            <col style={{ width: "8.4%" }} />
            <col style={{ width: "13.2%" }} />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={10} className={`${th} py-1.5 text-[16px] font-bold`}>
                NA INVOICE
              </th>
            </tr>
            <tr>
              <th rowSpan={2} className={th}>
                Sl No
              </th>
              <th rowSpan={2} className={th}>
                Farmers Name
              </th>
              <th rowSpan={2} className={th}>
                HSN / SAAC code
              </th>
              <th rowSpan={2} className={th}>
                Sy No
              </th>
              <th colSpan={2} className={th}>
                NA XTENT
              </th>
              <th rowSpan={2} className={th}>
                Affidavit ID
              </th>
              <th rowSpan={2} className={th}>
                Request ID
              </th>
              <th rowSpan={2} className={th}>
                Total Cents
              </th>
              <th className={`${th} text-[6.5px] leading-tight`}>{config.amountColumnTitle}</th>
            </tr>
            <tr>
              <th className={th}>Acres</th>
              <th className={th}>Guntas</th>
              <th className={`${th} text-[6.5px] font-normal`}>{rateLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className={`${td} py-4 text-center text-[#6B7280]`}>
                  No line items
                </td>
              </tr>
            ) : (
              rows.map((line, index) => (
                <tr key={`${line.farmerId ?? "x"}-${index}`}>
                  <td className={tdNum}>{index + 1}</td>
                  <td className={td}>{line.farmerName || line.description || "—"}</td>
                  <td className={tdNum}>{hsn || "—"}</td>
                  <td className={td}>{line.surveyNo || "—"}</td>
                  <td className={tdNum}>
                    {line.acres != null ? formatInvoiceDecimal(line.acres) : "—"}
                  </td>
                  <td className={tdNum}>
                    {line.gunta != null ? formatInvoiceDecimal(line.gunta) : "—"}
                  </td>
                  <td className={td}>{line.affidavitId || "—"}</td>
                  <td className={td}>{line.requestId || "—"}</td>
                  <td className={tdRight}>
                    {line.totalCents != null ? formatInvoiceTotalCents(line.totalCents) : "—"}
                  </td>
                  <td className={tdRight}>{formatInvoiceMoney(naLineAmount(line, rate))}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={8} className="border border-black bg-white" />
              <td className={`${td} text-right font-bold`}>Sub Total</td>
              <td className={`${tdRight} font-normal`}>{formatInvoiceMoney(totals.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={8} className="border border-black bg-white" />
              <td className={`${td} text-right font-bold`}>SGST @ 9% on</td>
              <td className={`${tdRight} font-normal`}>{formatInvoiceMoney(totals.sgst)}</td>
            </tr>
            <tr>
              <td colSpan={8} className="border border-black bg-white" />
              <td className={`${td} text-right font-bold`}>CGST @ 9% on</td>
              <td className={`${tdRight} font-normal`}>{formatInvoiceMoney(totals.cgst)}</td>
            </tr>
            <tr className="bg-[#1F2937] font-bold text-white">
              <td colSpan={8} className="border border-black bg-white" />
              <td className="border border-black bg-[#1F2937] px-0.5 py-1 text-right text-[9px] font-bold text-white">
                Grand Total
              </td>
              <td className="border border-black bg-[#1F2937] px-0.5 py-1 text-right text-[9px] font-bold tabular-nums text-white">
                {formatInvoiceMoney(totals.grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-2 text-[7.5px] leading-snug">
        <span className="font-bold">Value of Invoice: </span>
        {amountWords}
      </p>

      <div className="mt-4 flex items-end justify-between gap-4">
        <BankDetailsDisplay bank={prepared.bank} />
        <div className="text-right text-[7px] font-normal">
          <p className="font-medium">For {COMPANY_INVOICE_HEADER.signatureName}</p>
          <p className="mt-6">Authorized Signatory</p>
        </div>
      </div>
    </PdfPage>
  );
}
