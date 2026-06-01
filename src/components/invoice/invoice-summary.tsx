import { formatInvoiceMoney } from "@/lib/invoice-calculations";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
  compact?: boolean;
};

export function InvoiceSummary({ data, compact = false }: Props) {
  const { totals, ratePerAcre } = data;
  return (
    <div
      className={
        compact ? "invoice-summary-wrap mt-3 flex justify-end" : "invoice-summary-wrap mt-6 flex justify-end"
      }
    >
      <table
        className="w-[320px] shrink-0 border-collapse text-[11px]"
        style={{ tableLayout: "fixed" }}
      >
        <colgroup>
          <col />
          <col style={{ width: 140 }} />
        </colgroup>
        <tbody>
          {ratePerAcre > 0 ? (
            <tr>
              <td className="border border-[#D1D5DB] px-2 py-1.5 text-[#6B7280]">Rate / Acre</td>
              <td className="border border-[#D1D5DB] px-2 py-1.5 text-right tabular-nums">
                {formatInvoiceMoney(ratePerAcre)}
              </td>
            </tr>
          ) : null}
          <tr>
            <td className="border border-[#D1D5DB] px-2 py-1.5 font-medium">Subtotal</td>
            <td className="border border-[#D1D5DB] px-2 py-1.5 text-right font-medium tabular-nums">
              {formatInvoiceMoney(totals.subtotal)}
            </td>
          </tr>
          <tr>
            <td className="border border-[#D1D5DB] px-2 py-1.5">SGST @ 9%</td>
            <td className="border border-[#D1D5DB] px-2 py-1.5 text-right tabular-nums">
              {formatInvoiceMoney(totals.sgst)}
            </td>
          </tr>
          <tr>
            <td className="border border-[#D1D5DB] px-2 py-1.5">CGST @ 9%</td>
            <td className="border border-[#D1D5DB] px-2 py-1.5 text-right tabular-nums">
              {formatInvoiceMoney(totals.cgst)}
            </td>
          </tr>
          <tr className="bg-[#111827] text-white">
            <td className="border border-[#111827] px-2 py-2 font-bold">Grand Total</td>
            <td className="border border-[#111827] px-2 py-2 text-right text-[10px] font-bold leading-tight tabular-nums sm:text-[11px]">
              ₹ {formatInvoiceMoney(totals.grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
