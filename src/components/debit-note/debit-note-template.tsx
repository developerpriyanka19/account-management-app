import { CompanyBrandHeader } from "@/components/company-brand-header";
import { CompanyDocumentFooter } from "@/components/company-document-footer";
import { BankDetailsDisplay } from "@/components/bank/bank-details-display";
import type { DebitNotePayload } from "@/lib/debit-note-types";
import { DebitNoteType } from "@/lib/debit-note-types";

type Props = {
  data: DebitNotePayload;
  customerName: string;
  gstNumber: string;
  address: string;
};

function money(n: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

function chunkRows<T>(rows: T[], size: number): T[][] {
  if (rows.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

function HeaderBlock({
  data,
  customerName,
  gstNumber,
  address,
}: {
  data: DebitNotePayload;
  customerName: string;
  gstNumber: string;
  address: string;
}) {
  return (
    <>
      <header className="pb-1">
        <CompanyBrandHeader documentTitle="DEBIT NOTE" />
        <div className="flex items-center justify-between text-[11px] italic text-[#374151]">
          <p>Ref. No.</p>
          <p>Date :</p>
        </div>
        <div className="mt-1 border-b border-[#111827] pb-2">
          <div className="grid grid-cols-2 items-start gap-4">
            <div className="text-[10.5px] leading-snug">
              <p>
                <span className="font-semibold">Debit Note No:</span> {data.debitNoteNo}
              </p>
              <p>
                <span className="font-semibold">Customer Name:</span> {customerName || "—"}
              </p>
              <p>
                <span className="font-semibold">GST:</span> {gstNumber || "—"}
              </p>
              <p>
                <span className="font-semibold">Address:</span> {address || "—"}
              </p>
            </div>
            <div className="text-right text-[10.5px]">
              <p>
                <span className="font-semibold">Date:</span> {data.date}
              </p>
            </div>
          </div>
        </div>
      </header>
      <div className="mt-2 border-b border-[#111827] pb-1 text-[10.5px]">
        <div className="grid grid-cols-4 gap-2">
          <p><span className="font-semibold">District:</span> {data.district || "—"}</p>
          <p><span className="font-semibold">Taluk:</span> {data.taluk || "—"}</p>
          <p><span className="font-semibold">Village:</span> {data.village || "—"}</p>
          <p><span className="font-semibold">Hobli:</span> {data.hobbli || "—"}</p>
        </div>
      </div>
    </>
  );
}

function RemarkBlock({ remarks }: { remarks?: string | null }) {
  const text = remarks?.trim();
  if (!text) return null;
  return (
    <div className="mt-3 text-[10.5px] leading-snug text-[#111827]">
      <p className="font-semibold">Remark:</p>
      <p className="mt-0.5 whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function FooterAndSignature({ data }: { data: DebitNotePayload }) {
  return (
    <>
      <div className="mt-auto flex items-end justify-between gap-4 pt-4">
        <BankDetailsDisplay bank={data.bank} />
        <div className="text-right text-[11px]">
          <p className="font-semibold">For Apoorva Energy Solutions</p>
          <p className="mt-4 font-semibold">Authorized Signatory</p>
        </div>
      </div>
      <CompanyDocumentFooter className="pt-2" />
    </>
  );
}

export function DebitNoteTemplate({ data, customerName, gstNumber, address }: Props) {
  const rows = data.rows as any[];
  const totalLandConversionFee = rows.reduce((s, r) => s + (r.landConversionFee || 0), 0);
  const totalPodiFee = rows.reduce((s, r) => s + (r.podiFee || 0), 0);
  const totalRecoveryFee = rows.reduce((s, r) => s + (r.recoveryFee || 0), 0);
  const totalAcre = rows.reduce((s, r) => s + (r.acres || 0), 0);
  const totalGunta = rows.reduce((s, r) => s + (r.guntas || 0), 0);

  if (data.type === DebitNoteType.LAND_CONVERSION) {
    const detailPages = chunkRows(rows, 14);
    return (
      <article className="mx-auto w-full max-w-[210mm] bg-white font-serif text-[11px] text-[#111827]">
        <section className="flex min-h-[277mm] flex-col px-4 py-4 print:break-after-page">
          <HeaderBlock data={data} customerName={customerName} gstNumber={gstNumber} address={address} />
          <div className="mt-3 overflow-hidden rounded border border-[#111827]">
            <table className="w-full border-collapse text-[11px]">
              <thead className="bg-[#F3F4F6]">
                <tr>
                  <th className="border border-[#111827] px-2 py-1.5">Sl No</th>
                  <th className="border border-[#111827] px-2 py-1.5 text-left">Description</th>
                  <th className="border border-[#111827] px-2 py-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-[#111827] px-2 py-1.5 text-center">1</td><td className="border border-[#111827] px-2 py-1.5">Total Amount of Land Conversion Fee</td><td className="border border-[#111827] px-2 py-1.5 text-right">{money(totalLandConversionFee)}</td></tr>
                <tr><td className="border border-[#111827] px-2 py-1.5 text-center">2</td><td className="border border-[#111827] px-2 py-1.5">Total Amount of Podi Fee</td><td className="border border-[#111827] px-2 py-1.5 text-right">{money(totalPodiFee)}</td></tr>
                <tr><td className="border border-[#111827] px-2 py-1.5 text-center">3</td><td className="border border-[#111827] px-2 py-1.5">Total Amount of Other Recoveries Fee</td><td className="border border-[#111827] px-2 py-1.5 text-right">{money(totalRecoveryFee)}</td></tr>
                <tr className="font-bold"><td className="border border-[#111827] px-2 py-1.5" /><td className="border border-[#111827] px-2 py-1.5 text-center">Grand Total</td><td className="border border-[#111827] px-2 py-1.5 text-right">{money(data.total)}</td></tr>
              </tbody>
            </table>
          </div>
          <RemarkBlock remarks={data.remarks} />
          <FooterAndSignature data={data} />
        </section>

        {detailPages.map((pageRows, pageIndex) => (
          <section
            key={pageIndex}
            className={`flex min-h-[277mm] flex-col px-4 py-4 ${pageIndex < detailPages.length - 1 ? "print:break-after-page" : ""}`}
          >
            <HeaderBlock data={data} customerName={customerName} gstNumber={gstNumber} address={address} />
            <div className="mt-3 overflow-hidden rounded border border-[#111827]">
              <table className="w-full border-collapse text-[9px]">
                <thead className="bg-[#F3F4F6]">
                  <tr>
                    <th className="border border-[#111827] px-1 py-1">Sl No</th>
                    <th className="border border-[#111827] px-1 py-1">Farmer Name</th>
                    <th className="border border-[#111827] px-1 py-1">Survey No</th>
                    <th className="border border-[#111827] px-1 py-1 text-right">NA Extent Acre</th>
                    <th className="border border-[#111827] px-1 py-1 text-right">Gunta</th>
                    <th className="border border-[#111827] px-1 py-1">Land Conversion Fee Challan Ref No</th>
                    <th className="border border-[#111827] px-1 py-1 text-right">Fee</th>
                    <th className="border border-[#111827] px-1 py-1">Podi Fee Challan Ref No</th>
                    <th className="border border-[#111827] px-1 py-1 text-right">Fee</th>
                    <th className="border border-[#111827] px-1 py-1">Other Recoveries Challan Ref No</th>
                    <th className="border border-[#111827] px-1 py-1 text-right">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, i) => (
                    <tr key={i}>
                      <td className="border border-[#111827] px-1 py-1 text-center">{pageIndex * 14 + i + 1}</td>
                      <td className="border border-[#111827] px-1 py-1">{r.farmerName || "—"}</td>
                      <td className="border border-[#111827] px-1 py-1">{r.surveyNo || "—"}</td>
                      <td className="border border-[#111827] px-1 py-1 text-right">{r.acres ?? "—"}</td>
                      <td className="border border-[#111827] px-1 py-1 text-right">{r.guntas ?? "—"}</td>
                      <td className="border border-[#111827] px-1 py-1">{r.landConversionChallanRefNo || "—"}</td>
                      <td className="border border-[#111827] px-1 py-1 text-right">{money(r.landConversionFee || 0)}</td>
                      <td className="border border-[#111827] px-1 py-1">{r.podiChallanRefNo || "—"}</td>
                      <td className="border border-[#111827] px-1 py-1 text-right">{money(r.podiFee || 0)}</td>
                      <td className="border border-[#111827] px-1 py-1">{r.recoveryChallanRefNo || "—"}</td>
                      <td className="border border-[#111827] px-1 py-1 text-right">{money(r.recoveryFee || 0)}</td>
                    </tr>
                  ))}
                  {pageIndex === detailPages.length - 1 ? (
                    <tr className="font-semibold">
                      <td colSpan={3} className="border border-[#111827] px-1 py-1 text-right">Totals</td>
                      <td className="border border-[#111827] px-1 py-1 text-right">{totalAcre.toFixed(2)}</td>
                      <td className="border border-[#111827] px-1 py-1 text-right">{totalGunta.toFixed(2)}</td>
                      <td className="border border-[#111827] px-1 py-1" />
                      <td className="border border-[#111827] px-1 py-1 text-right">{money(totalLandConversionFee)}</td>
                      <td className="border border-[#111827] px-1 py-1" />
                      <td className="border border-[#111827] px-1 py-1 text-right">{money(totalPodiFee)}</td>
                      <td className="border border-[#111827] px-1 py-1" />
                      <td className="border border-[#111827] px-1 py-1 text-right">{money(totalRecoveryFee)}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {pageIndex === detailPages.length - 1 ? (
              <div className="mt-3 text-right text-[10.5px] font-bold">Grand Total: {money(data.total)}</div>
            ) : null}
            {pageIndex === detailPages.length - 1 ? <RemarkBlock remarks={data.remarks} /> : null}
            <FooterAndSignature data={data} />
          </section>
        ))}
      </article>
    );
  }

  const totalAtl = rows.reduce((s, r) => s + (r.atlCharges || 0), 0);
  const totalPoa = rows.reduce((s, r) => s + (r.poaCharges || 0), 0);
  const totalCheque = rows.reduce((s, r) => s + (r.chequeAmount || 0), 0);
  const totalCash = rows.reduce((s, r) => s + (r.cashAmount || 0), 0);
  const totalChequeCash = totalCheque + totalCash;

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white font-serif text-[11px] text-[#111827]">
      <section className="flex min-h-[277mm] flex-col px-4 py-4 print:break-after-page">
        <HeaderBlock data={data} customerName={customerName} gstNumber={gstNumber} address={address} />
        <div className="mt-3 overflow-hidden rounded border border-[#111827]">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-[#F3F4F6]">
              <tr>
                <th className="border border-[#111827] px-2 py-1.5">SL No</th>
                <th className="border border-[#111827] px-2 py-1.5 text-left">Executed of ATL & POA (GPA)</th>
                <th className="border border-[#111827] px-2 py-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-[#111827] px-2 py-1.5 text-center">1</td><td className="border border-[#111827] px-2 py-1.5">Total Amount of ATL</td><td className="border border-[#111827] px-2 py-1.5 text-right">{money(totalAtl)}</td></tr>
              <tr><td className="border border-[#111827] px-2 py-1.5 text-center">2</td><td className="border border-[#111827] px-2 py-1.5">Total Amount of POA OR GPA</td><td className="border border-[#111827] px-2 py-1.5 text-right">{money(totalPoa)}</td></tr>
              <tr><td className="border border-[#111827] px-2 py-1.5 text-center">3</td><td className="border border-[#111827] px-2 py-1.5">AES Pay To Farmers Cheque And Cash</td><td className="border border-[#111827] px-2 py-1.5 text-right">{money(totalChequeCash)}</td></tr>
              <tr className="font-bold"><td className="border border-[#111827] px-2 py-1.5" /><td className="border border-[#111827] px-2 py-1.5 text-center">TOTAL AMOUNT</td><td className="border border-[#111827] px-2 py-1.5 text-right">{money(data.total)}</td></tr>
            </tbody>
          </table>
        </div>
        <RemarkBlock remarks={data.remarks} />
        <FooterAndSignature data={data} />
      </section>

      <section className="flex min-h-[277mm] flex-col px-4 py-4">
        <HeaderBlock data={data} customerName={customerName} gstNumber={gstNumber} address={address} />
        <div className="mt-3 overflow-hidden rounded border border-[#111827]">
          <table className="w-full border-collapse text-[9px]">
            <thead className="bg-[#F3F4F6]">
              <tr>
                <th className="border border-[#111827] px-1 py-1" rowSpan={2}>Sl No</th>
                <th className="border border-[#111827] px-1 py-1" rowSpan={2}>Farmer Name</th>
                <th className="border border-[#111827] px-1 py-1" rowSpan={2}>Survey No</th>
                <th className="border border-[#111827] px-1 py-1" colSpan={2}>RTC Extent</th>
                <th className="border border-[#111827] px-1 py-1" colSpan={2}>Lease Extent</th>
                <th className="border border-[#111827] px-1 py-1 text-right" rowSpan={2}>ATL Charges</th>
                <th className="border border-[#111827] px-1 py-1 text-right" rowSpan={2}>POA Charges</th>
                <th className="border border-[#111827] px-1 py-1" colSpan={5}>AES Pay To Farmers Cheque And Cash</th>
              </tr>
              <tr>
                <th className="border border-[#111827] px-1 py-1 text-right">Acre</th>
                <th className="border border-[#111827] px-1 py-1 text-right">Gunta</th>
                <th className="border border-[#111827] px-1 py-1 text-right">Acre</th>
                <th className="border border-[#111827] px-1 py-1 text-right">Gunta</th>
                <th className="border border-[#111827] px-1 py-1">Cheque No</th>
                <th className="border border-[#111827] px-1 py-1">Date</th>
                <th className="border border-[#111827] px-1 py-1 text-right">Amount</th>
                <th className="border border-[#111827] px-1 py-1">Bank Name</th>
                <th className="border border-[#111827] px-1 py-1 text-right">Cash</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="border border-[#111827] px-1 py-1 text-center">{i + 1}</td>
                  <td className="border border-[#111827] px-1 py-1">{r.farmerName || "—"}</td>
                  <td className="border border-[#111827] px-1 py-1">{r.surveyNo || "—"}</td>
                  <td className="border border-[#111827] px-1 py-1 text-right">{r.rtcAcre ?? "—"}</td>
                  <td className="border border-[#111827] px-1 py-1 text-right">{r.rtcGunta ?? "—"}</td>
                  <td className="border border-[#111827] px-1 py-1 text-right">{r.leaseAcre ?? "—"}</td>
                  <td className="border border-[#111827] px-1 py-1 text-right">{r.leaseGunta ?? "—"}</td>
                  <td className="border border-[#111827] px-1 py-1 text-right">{money(r.atlCharges || 0)}</td>
                  <td className="border border-[#111827] px-1 py-1 text-right">{money(r.poaCharges || 0)}</td>
                  <td className="border border-[#111827] px-1 py-1">{r.chequeNo || "—"}</td>
                  <td className="border border-[#111827] px-1 py-1">{r.chequeDate || "—"}</td>
                  <td className="border border-[#111827] px-1 py-1 text-right">{money(r.chequeAmount || 0)}</td>
                  <td className="border border-[#111827] px-1 py-1">{r.bankName || "—"}</td>
                  <td className="border border-[#111827] px-1 py-1 text-right">{money(r.cashAmount || 0)}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td colSpan={3} className="border border-[#111827] px-1 py-1 text-right">Totals</td>
                <td className="border border-[#111827] px-1 py-1 text-right">{money(rows.reduce((s, r) => s + (r.rtcAcre || 0), 0))}</td>
                <td className="border border-[#111827] px-1 py-1 text-right">{money(rows.reduce((s, r) => s + (r.rtcGunta || 0), 0))}</td>
                <td className="border border-[#111827] px-1 py-1 text-right">{money(rows.reduce((s, r) => s + (r.leaseAcre || 0), 0))}</td>
                <td className="border border-[#111827] px-1 py-1 text-right">{money(rows.reduce((s, r) => s + (r.leaseGunta || 0), 0))}</td>
                <td className="border border-[#111827] px-1 py-1 text-right">{money(totalAtl)}</td>
                <td className="border border-[#111827] px-1 py-1 text-right">{money(totalPoa)}</td>
                <td className="border border-[#111827] px-1 py-1" />
                <td className="border border-[#111827] px-1 py-1" />
                <td className="border border-[#111827] px-1 py-1 text-right">{money(totalCheque)}</td>
                <td className="border border-[#111827] px-1 py-1" />
                <td className="border border-[#111827] px-1 py-1 text-right">{money(totalCash)}</td>
              </tr>
              <tr className="font-semibold">
                <td colSpan={13} className="border border-[#111827] px-1 py-1 text-right">Total Amount</td>
                <td className="border border-[#111827] px-1 py-1 text-right">{money(data.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-right text-[10.5px] font-bold">TOTAL AMOUNT: {money(data.total)}</div>
        <RemarkBlock remarks={data.remarks} />
        <FooterAndSignature data={data} />
      </section>
    </article>
  );
}
