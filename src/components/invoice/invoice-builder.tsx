"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, Loader2, Printer, Save } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { saveInvoice } from "@/app/invoice/actions";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";
import { useToast } from "@/components/customer/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeInvoiceTotals,
  computeLineAmounts,
  formatInvoiceNumber,
} from "@/lib/invoice-calculations";
import {
  defaultSubtypeForCategory,
  getSubtypesForCategory,
  type InvoiceCategory,
} from "@/lib/invoice-config";
import type {
  InvoiceBillingCustomerOption,
  InvoiceDocumentData,
  InvoiceFarmerOption,
  InvoiceLineInput,
} from "@/lib/invoice-types";
import { farmerToInvoiceLine } from "@/lib/invoice-types";
import { cn } from "@/lib/utils";

type Props = {
  category: InvoiceCategory;
  title: string;
  customers: InvoiceBillingCustomerOption[];
  farmers: InvoiceFarmerOption[];
  nextSequence: number;
};

export function InvoiceBuilder({
  category,
  title,
  customers,
  farmers,
  nextSequence,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);

  const [customerId, setCustomerId] = useState<number | "">("");
  const [subType, setSubType] = useState(defaultSubtypeForCategory(category));
  const [invoiceDate, setInvoiceDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [ratePerAcre, setRatePerAcre] = useState("500");
  const [notes, setNotes] = useState("");
  const [selectedFarmerIds, setSelectedFarmerIds] = useState<number[]>([]);
  const [lines, setLines] = useState<InvoiceLineInput[]>([]);

  const subtypes = getSubtypesForCategory(category);
  const rate = Number(ratePerAcre) || 0;

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );

  const syncLinesFromFarmers = useCallback(
    (ids: number[]) => {
      const next = ids
        .map((id) => farmers.find((f) => f.id === id))
        .filter((f): f is InvoiceFarmerOption => Boolean(f))
        .map((f) => farmerToInvoiceLine(f, rate));
      setLines(next);
    },
    [farmers, rate],
  );

  function toggleFarmer(id: number) {
    setSelectedFarmerIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      syncLinesFromFarmers(next);
      return next;
    });
  }

  const documentData: InvoiceDocumentData | null = useMemo(() => {
    if (!selectedCustomer) return null;
    const computedLines = computeLineAmounts(lines, rate, category);
    const totals = computeInvoiceTotals(computedLines);
    return {
      invoiceType: category,
      subType,
      invoiceNumber: formatInvoiceNumber(category, nextSequence),
      invoiceDate,
      status: "draft",
      ratePerAcre: rate,
      notes,
      customer: {
        id: selectedCustomer.id,
        companyName: selectedCustomer.companyName ?? selectedCustomer.label,
        companyAddress: selectedCustomer.companyAddress ?? "",
        gstNumber: selectedCustomer.gstNumber,
        state: selectedCustomer.state ?? "",
        panNumber: selectedCustomer.panNumber ?? "",
      },
      lines: computedLines,
      totals,
    };
  }, [
    selectedCustomer,
    lines,
    rate,
    category,
    subType,
    invoiceDate,
    notes,
    nextSequence,
  ]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: documentData?.invoiceNumber ?? "Invoice",
  });

  function updateLine(index: number, patch: Partial<InvoiceLineInput>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function recalculateAmounts() {
    setLines((prev) => computeLineAmounts(prev, rate, category));
  }

  function handleSave(status: "draft" | "final") {
    if (!documentData) {
      toast.error("Select a customer and at least one farmer.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await saveInvoice(documentData, status);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(status === "draft" ? "Draft saved." : "Invoice saved.");
        if (status === "draft" && result.ok) {
          router.push(`/invoice/${result.id}`);
        }
      } catch {
        // redirect from saveInvoice on final
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <header>
          <h1 className="text-xl font-semibold text-[#111827] sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Select customer → select farmers → review amounts → print or save
          </p>
        </header>

        <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#111827]">1. Customer</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Billing customer</Label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")}
                className="mt-1 flex h-9 w-full rounded-md border border-[#E5E7EB] px-3 text-sm"
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} · {c.gstNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Invoice sub-type</Label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-[#E5E7EB] px-3 text-sm"
              >
                {subtypes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Invoice date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="mt-1 h-9"
              />
            </div>
            {category === "na" ? (
              <div>
                <Label>Rate per acre (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={ratePerAcre}
                  onChange={(e) => setRatePerAcre(e.target.value)}
                  onBlur={recalculateAmounts}
                  className="mt-1 h-9"
                />
              </div>
            ) : null}
          </div>
          {selectedCustomer ? (
            <p className="mt-2 text-xs text-[#6B7280]">
              {selectedCustomer.companyAddress ?? "—"} · GST {selectedCustomer.gstNumber}
            </p>
          ) : null}
        </section>

        <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#111827]">2. Farmers</h2>
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded border border-[#E5E7EB] p-2">
            {farmers.map((f) => {
              const checked = selectedFarmerIds.includes(f.id);
              return (
                <li key={f.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm",
                      checked && "bg-[#EFF6FF]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFarmer(f.id)}
                    />
                    <span className="font-medium">{f.label}</span>
                    <span className="text-xs text-[#6B7280]">{f.surveyNo ?? "—"}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        {lines.length > 0 ? (
          <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#111827]">3. Line items</h2>
              <Button type="button" variant="outline" size="sm" onClick={recalculateAmounts}>
                Recalculate
              </Button>
            </div>
            <div className="mt-3 overflow-x-auto overscroll-x-contain rounded-md border border-[#E5E7EB]">
              <table
                className="w-full min-w-[920px] border-collapse text-xs"
                style={{ tableLayout: "fixed" }}
              >
                <colgroup>
                  <col style={{ width: 110 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 140 }} />
                </colgroup>
                <thead className="sticky top-0 z-[1] bg-[#F9FAFB]">
                  <tr className="border-b border-[#E5E7EB] text-left text-[#374151]">
                    <th className="px-2 py-2 font-semibold">Survey</th>
                    <th className="px-2 py-2 font-semibold">Village</th>
                    <th className="px-2 py-2 text-right font-semibold">Acre</th>
                    <th className="px-2 py-2 text-right font-semibold">Gunta</th>
                    <th className="px-2 py-2 font-semibold">Affidavit</th>
                    <th className="px-2 py-2 font-semibold">Request</th>
                    <th className="px-2 py-2 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr
                      key={i}
                      className={cn(
                        "border-b border-[#F3F4F6]",
                        i % 2 === 1 && "bg-[#FAFBFC]",
                      )}
                    >
                      <td className="px-2 py-1.5">
                        <Input
                          value={line.surveyNo}
                          onChange={(e) => updateLine(i, { surveyNo: e.target.value })}
                          className="h-8 w-full min-w-0 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={line.village}
                          onChange={(e) => updateLine(i, { village: e.target.value })}
                          className="h-8 w-full min-w-0 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          value={line.acres ?? ""}
                          onChange={(e) =>
                            updateLine(i, {
                              acres: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="h-8 w-full min-w-0 text-right text-xs tabular-nums"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          value={line.gunta ?? ""}
                          onChange={(e) =>
                            updateLine(i, {
                              gunta: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="h-8 w-full min-w-0 text-right text-xs tabular-nums"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={line.affidavitId}
                          onChange={(e) => updateLine(i, { affidavitId: e.target.value })}
                          className="h-8 w-full min-w-0 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={line.requestId}
                          onChange={(e) => updateLine(i, { requestId: e.target.value })}
                          className="h-8 w-full min-w-0 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          value={line.amount}
                          onChange={(e) =>
                            updateLine(i, { amount: Number(e.target.value) || 0 })
                          }
                          className="h-8 w-full min-w-0 text-right text-xs tabular-nums"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {documentData ? (
              <p className="mt-3 text-right text-sm font-semibold text-[#111827]">
                Grand total (incl. GST): ₹
                {documentData.totals.grandTotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="no-print sticky bottom-4 z-10 flex flex-wrap gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-lg backdrop-blur print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!documentData}
            onClick={() => setShowPreview((v) => !v)}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!documentData}
            onClick={() => handlePrint()}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!documentData || pending}
            onClick={() => {
              if (!documentData) return;
              handlePrint();
            }}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!documentData || pending}
            onClick={() => handleSave("draft")}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save draft
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!documentData || pending}
            onClick={() => handleSave("final")}
          >
            Save & view
          </Button>
        </div>
      </div>

      {showPreview && documentData ? (
        <aside className="w-full shrink-0 lg:w-[min(100%,920px)] lg:max-w-[920px]">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto overscroll-contain rounded-lg border border-[#D1D5DB] bg-[#F3F4F6] p-4 shadow-sm">
            <p className="mb-3 text-center text-xs font-medium text-[#6B7280]">
              Invoice preview — scroll horizontally on narrow screens
            </p>
            <InvoiceDocumentPreview ref={printRef} data={documentData} />
          </div>
        </aside>
      ) : (
        <div className="hidden">
          {documentData ? <InvoiceDocumentPreview ref={printRef} data={documentData} /> : null}
        </div>
      )}
    </div>
  );
}
