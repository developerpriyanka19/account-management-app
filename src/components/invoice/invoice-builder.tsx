"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, Loader2, Printer, Save } from "lucide-react";
import { BankAccountSelect } from "@/components/bank/bank-account-select";
import { saveInvoice } from "@/app/invoice/actions";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";
import {
  generateInvoicePdf,
  printInvoicePdf,
} from "@/components/invoice/invoice-pdf-generator";
import { PreviewPanel } from "@/components/preview/preview-panel";
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
import { gstCustomerToInvoiceCustomer } from "@/lib/invoice-customer-format";
import {
  bankFromSelection,
  initialBankSelection,
  type BankDetailsOption,
} from "@/lib/bank-details-types";
import type {
  InvoiceBillingCustomerOption,
  InvoiceDocumentData,
  InvoiceFarmerOption,
  InvoiceLineInput,
} from "@/lib/invoice-types";
import { locationFromCustomer } from "@/lib/invoice-location";
import { farmerToInvoiceLine } from "@/lib/invoice-types";
import { cn } from "@/lib/utils";

type Props = {
  category: InvoiceCategory;
  title: string;
  customers: InvoiceBillingCustomerOption[];
  farmers: InvoiceFarmerOption[];
  banks: BankDetailsOption[];
  nextSequence: number;
  existing?: InvoiceDocumentData | null;
};

export function InvoiceBuilder({
  category,
  title,
  customers,
  farmers,
  banks,
  nextSequence,
  existing = null,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);

  const [customerId, setCustomerId] = useState<number | "">(
    () => existing?.customer.id ?? "",
  );
  const [subType, setSubType] = useState(
    () => existing?.subType ?? defaultSubtypeForCategory(category),
  );
  const [invoiceDate, setInvoiceDate] = useState(
    () => existing?.invoiceDate ?? new Date().toISOString().slice(0, 10),
  );
  const [ratePerAcre, setRatePerAcre] = useState(
    () => String(existing?.ratePerAcre ?? 500),
  );
  const [notes, setNotes] = useState(() => existing?.notes ?? "");
  const [district, setDistrict] = useState(() => existing?.district ?? "");
  const [taluk, setTaluk] = useState(() => existing?.taluk ?? "");
  const [village, setVillage] = useState(() => existing?.village ?? "");
  const [hobbli, setHobbli] = useState(() => existing?.hobbli ?? "");
  const [state, setState] = useState(() => existing?.state ?? "");
  const [selectedFarmerIds, setSelectedFarmerIds] = useState<number[]>(() =>
    (existing?.lines ?? [])
      .map((l) => l.farmerId)
      .filter((id): id is number => id != null),
  );
  const [lines, setLines] = useState<InvoiceLineInput[]>(() => existing?.lines ?? []);
  const [bankDetailsId, setBankDetailsId] = useState<number | "">(() =>
    initialBankSelection(existing?.bank, banks),
  );

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

  const locationFields = useMemo(
    () => ({
      district,
      taluk,
      village,
      hobbli,
      state,
    }),
    [district, taluk, village, hobbli, state],
  );

  function applyCustomerLocation(customer: InvoiceBillingCustomerOption) {
    const loc = locationFromCustomer(customer);
    setHobbli(loc.hobbli);
    setVillage(loc.village);
    setTaluk(loc.taluk);
    setDistrict(loc.district);
    setState(loc.state);
  }

  const documentData: InvoiceDocumentData | null = useMemo(() => {
    if (!selectedCustomer) return null;
    const computedLines =
      category === "service" ? lines : computeLineAmounts(lines, rate, category);
    const totals = computeInvoiceTotals(computedLines);
    return {
      id: existing?.id,
      invoiceType: category,
      subType,
      invoiceNumber:
        existing?.invoiceNumber ?? formatInvoiceNumber(category, nextSequence),
      invoiceDate,
      district: locationFields.district,
      taluk: locationFields.taluk,
      village: locationFields.village,
      hobbli: locationFields.hobbli,
      state: locationFields.state,
      status: "draft",
      ratePerAcre: rate,
      notes,
      customer: gstCustomerToInvoiceCustomer({
        id: selectedCustomer.id,
        companyName: selectedCustomer.companyName,
        gstNumber: selectedCustomer.gstNumber,
        buildingNumber: selectedCustomer.buildingNumber,
        street: selectedCustomer.street,
        locality: selectedCustomer.locality,
        village: selectedCustomer.village,
        district: selectedCustomer.district,
        pincode: selectedCustomer.pincode,
        state: selectedCustomer.state,
        panNumber: selectedCustomer.panNumber,
      }),
      lines: computedLines,
      totals,
      bank: bankFromSelection(bankDetailsId, banks) ?? existing?.bank ?? {
        bankDetailsId: null,
        bankName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
      },
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
    existing?.id,
    existing?.invoiceNumber,
    existing?.bank,
    locationFields,
    bankDetailsId,
    banks,
  ]);

  useEffect(() => {
    if (!showPreview) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowPreview(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPreview]);

  function updateLine(index: number, patch: Partial<InvoiceLineInput>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function recalculateAmounts() {
    setLines((prev) => computeLineAmounts(prev, rate, category));
  }

  function handleSave(status: "DRAFT" | "FINAL") {
    if (!documentData) {
      toast.error("Select a customer and at least one farmer.");
      return;
    }
    if (!documentData.bank.bankDetailsId) {
      toast.error("Select a bank account.");
      return;
    }
    startTransition(async () => {
      const result = await saveInvoice(documentData, status);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(status === "DRAFT" ? "Draft saved." : "Invoice saved.");
      router.push(
        documentData.invoiceType === "na"
          ? `/invoice/na/${result.id}`
          : `/invoice/${result.id}`,
      );
      router.refresh();
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
                onChange={(e) => {
                  const nextId = e.target.value ? Number(e.target.value) : "";
                  setCustomerId(nextId);
                  if (nextId) {
                    const customer = customers.find((c) => c.id === nextId);
                    if (customer) applyCustomerLocation(customer);
                  }
                }}
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
          <div className="mt-3">
            <BankAccountSelect
              banks={banks}
              value={bankDetailsId}
              onChange={setBankDetailsId}
            />
          </div>
          {category === "service" ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label>Hobli</Label>
                <Input value={hobbli} onChange={(e) => setHobbli(e.target.value)} className="mt-1 h-9" />
              </div>
              <div>
                <Label>Village</Label>
                <Input value={village} onChange={(e) => setVillage(e.target.value)} className="mt-1 h-9" />
              </div>
              <div>
                <Label>Taluk</Label>
                <Input value={taluk} onChange={(e) => setTaluk(e.target.value)} className="mt-1 h-9" />
              </div>
              <div>
                <Label>District</Label>
                <Input value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-1 h-9" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1 h-9" />
              </div>
            </div>
          ) : null}
          {selectedCustomer ? (
            <p className="mt-2 text-xs text-[#6B7280]">
              {selectedCustomer.district ?? "—"}, {selectedCustomer.state ?? "—"} · PIN{" "}
              {selectedCustomer.pincode ?? "—"} · GST {selectedCustomer.gstNumber}
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
              {category === "na" ? (
                <Button type="button" variant="outline" size="sm" onClick={recalculateAmounts}>
                  Recalculate
                </Button>
              ) : null}
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
                          step="any"
                          value={line.amount ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            updateLine(i, {
                              amount: raw === "" ? null : Number(raw),
                            });
                          }}
                          className="h-8 w-full min-w-0 text-right text-xs tabular-nums"
                          placeholder="Enter amount"
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

        <div className="top-actions no-print sticky bottom-4 z-10 flex flex-wrap gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-lg backdrop-blur">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!documentData}
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!documentData || pending}
            onClick={() => {
              if (!documentData) return;
              void generateInvoicePdf(documentData);
            }}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!documentData}
            onClick={() => {
              if (!documentData) return;
              void printInvoicePdf(documentData);
            }}
          >
            <Printer className="h-4 w-4" />
            Open PDF to Print
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!documentData || pending}
            onClick={() => handleSave("DRAFT")}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save draft
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!documentData || pending}
            onClick={() => handleSave("FINAL")}
          >
            Save & view
          </Button>
        </div>
      </div>

      {showPreview && documentData ? (
        <PreviewPanel
          title="Invoice Preview"
          closeLabel="Close Preview"
          onClose={() => setShowPreview(false)}
        >
          <InvoiceDocumentPreview data={documentData} />
        </PreviewPanel>
      ) : null}
    </div>
  );
}
