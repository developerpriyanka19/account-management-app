import {
  formatInvoiceInteger,
  formatInvoiceMoney,
  invoiceLineTaxableAmount,
} from "@/lib/invoice-calculations";
import type { InvoiceDocumentData } from "@/lib/invoice-types";
import { cn } from "@/lib/utils";

type Props = {
  data: InvoiceDocumentData;
  showNaColumns?: boolean;
};

const thBase =
  "border border-[#111827] px-2 py-2 text-left text-[10px] font-bold leading-tight text-[#111827]";

const tdBase =
  "border border-[#D1D5DB] px-2 py-1.5 align-middle overflow-hidden break-words whitespace-normal text-[10px] leading-snug text-[#111827]";

const tdNumeric =
  "text-right tabular-nums text-[9px] leading-tight sm:text-[10px]";

const tdAmount =
  "text-right tabular-nums text-[9px] font-semibold leading-tight sm:text-[10px]";

function NaColGroup() {
  return (
    <colgroup>
      <col style={{ width: 60 }} />
      <col style={{ width: 140 }} />
      <col style={{ width: 100 }} />
      <col style={{ width: 110 }} />
      <col style={{ width: 110 }} />
      <col style={{ width: 100 }} />
      <col style={{ width: 110 }} />
      <col style={{ width: 100 }} />
      <col style={{ width: 120 }} />
      <col style={{ width: 120 }} />
      <col style={{ width: 120 }} />
      <col style={{ width: 120 }} />
      <col style={{ width: 90 }} />
      <col style={{ width: 90 }} />
      <col style={{ width: 100 }} />
    </colgroup>
  );
}

function ServiceColGroup() {
  return (
    <colgroup>
      <col style={{ width: 60 }} />
      <col />
      <col style={{ width: 140 }} />
    </colgroup>
  );
}

export function InvoiceTable({ data, showNaColumns = true }: Props) {
  const minWidth = showNaColumns ? 1580 : 480;

  return (
    <div
      className={
        showNaColumns
          ? "invoice-table-scroll mt-4 -mx-1 overflow-x-auto overscroll-x-contain"
          : "invoice-table-scroll mt-2 -mx-1 overflow-x-auto overscroll-x-contain"
      }
    >
      <table
        className="invoice-line-table w-full border-collapse text-[10px]"
        style={{ minWidth, tableLayout: "fixed" }}
      >
        {showNaColumns ? <NaColGroup /> : <ServiceColGroup />}
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#F3F4F6] shadow-[0_1px_0_#D1D5DB]">
            <th className={cn(thBase)}>Sl No</th>
            {showNaColumns ? (
              <>
                <th className={cn(thBase)}>Farmer Name</th>
                <th className={cn(thBase)}>Survey No</th>
                <th className={cn(thBase)}>District</th>
                <th className={cn(thBase)}>Taluk</th>
                <th className={cn(thBase)}>Village</th>
                <th className={cn(thBase)}>Hobbli</th>
                <th className={cn(thBase)}>Affidavit ID</th>
                <th className={cn(thBase)}>Request ID</th>
                <th className={cn(thBase, "text-right")}>Debit Note</th>
                <th className={cn(thBase)}>Remark</th>
                <th className={cn(thBase, "text-right")}>Acres</th>
                <th className={cn(thBase, "text-right")}>Guntas</th>
                <th className={cn(thBase, "text-right")}>Total Cents</th>
              </>
            ) : (
              <th className={cn(thBase)} colSpan={1}>
                Description
              </th>
            )}
            {!showNaColumns ? <th className={cn(thBase, "text-right")}>Amount (₹)</th> : null}
          </tr>
        </thead>
        <tbody>
          {data.lines.length === 0 ? (
            <tr>
              <td
                colSpan={showNaColumns ? 15 : 3}
                className="border border-[#D1D5DB] px-2 py-6 text-center text-[#6B7280]"
              >
                No line items
              </td>
            </tr>
          ) : (
            data.lines.map((line, index) => (
              <tr
                key={`${line.farmerId ?? "x"}-${index}`}
                className="even:bg-[#FAFBFC] odd:bg-white"
              >
                <td className={cn(tdBase, "text-center tabular-nums")}>{index + 1}</td>
                {showNaColumns ? (
                  <>
                    <td className={tdBase}>
                      <span className="block max-w-full">{line.farmerName || line.description}</span>
                    </td>
                    <td className={tdBase}>
                      <span className="block max-w-full">{line.surveyNo}</span>
                    </td>
                    <td className={tdBase}>
                      <span className="block max-w-full">{line.district}</span>
                    </td>
                    <td className={tdBase}>
                      <span className="block max-w-full">{line.taluk}</span>
                    </td>
                    <td className={tdBase}>
                      <span className="block max-w-full">{line.village}</span>
                    </td>
                    <td className={tdBase}>
                      <span className="block max-w-full">{line.hobbli}</span>
                    </td>
                    <td className={tdBase}>
                      <span className="block max-w-full break-all">
                        {line.affidavitId || "—"}
                      </span>
                    </td>
                    <td className={tdBase}>
                      <span className="block max-w-full break-all">
                        {line.requestId || "—"}
                      </span>
                    </td>
                    <td className={cn(tdBase, tdNumeric)}>{formatInvoiceMoney(line.debitNote || 0)}</td>
                    <td className={tdBase}>{line.remark || "—"}</td>
                    <td className={cn(tdBase, tdNumeric)}>{formatInvoiceInteger(line.acres)}</td>
                    <td className={cn(tdBase, tdNumeric)}>{formatInvoiceInteger(line.gunta)}</td>
                    <td className={cn(tdBase, tdNumeric)}>{formatInvoiceInteger(line.totalCents)}</td>
                  </>
                ) : (
                  <td className={tdBase}>
                    <span className="block max-w-full">
                      {line.description || line.surveyNo}
                    </span>
                  </td>
                )}
                {!showNaColumns ? (
                  <td className={cn(tdBase, tdAmount)}>
                    <span className="block max-w-full">
                      {formatInvoiceMoney(invoiceLineTaxableAmount(line))}
                    </span>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
