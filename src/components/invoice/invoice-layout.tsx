import type { ReactNode } from "react";
import { BankDetailsDisplay } from "@/components/bank/bank-details-display";
import { CompanyDocumentFooter } from "@/components/company-document-footer";
import { PdfPage } from "@/components/pdf/pdf-page";
import { COMPANY_INVOICE_HEADER } from "@/lib/invoice-config";
import { InvoiceHeader } from "./invoice-header";
import { InvoiceSummary } from "./invoice-summary";
import { InvoiceTable } from "./invoice-table";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
  showNaColumns?: boolean;
  footer?: ReactNode;
};

/** A4 print-friendly invoice document shell. */
export function InvoiceLayout({ data, showNaColumns = true, footer }: Props) {
  const isService = !showNaColumns;
  return (
    <PdfPage
      isLastPage
      className={
        isService
          ? "invoice-print-area mx-auto w-full min-w-0 max-w-[900px] bg-white px-4 py-4 text-[#111827] shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none"
          : "invoice-print-area mx-auto w-full min-w-0 max-w-[900px] bg-white px-6 py-8 text-[#111827] shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none"
      }
      header={<InvoiceHeader data={data} compact={isService} />}
      footer={footer ?? <CompanyDocumentFooter compact={isService} className="border-0 pt-0" />}
    >
      <InvoiceTable data={data} showNaColumns={showNaColumns} />
      <InvoiceSummary data={data} compact={isService} />
      {data.totalAmountWords ? (
        <p className="mt-3 text-[11px] text-[#111827]">
          <span className="font-semibold">Total Amount in Words: </span>
          {data.totalAmountWords}
        </p>
      ) : null}
      {data.notes ? (
        <p className="mt-4 text-[10px] text-[#6B7280]">
          <span className="font-semibold">Notes: </span>
          {data.notes}
        </p>
      ) : null}
      <div className="mt-4 flex items-end justify-between gap-4">
        <BankDetailsDisplay bank={data.bank} className="text-[10px] leading-snug" />
        <div className="text-right text-[10px] font-normal">
          <p className="font-medium">For {COMPANY_INVOICE_HEADER.signatureName}</p>
          <p className="mt-4">Authorized Signatory</p>
        </div>
      </div>
    </PdfPage>
  );
}
