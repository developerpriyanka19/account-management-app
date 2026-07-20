"use client";

import { Download, Loader2, Plus, Printer, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CustomerCombobox } from "@/components/invoice/customer-combobox";
import { QuotationTemplate } from "@/components/quotation/quotation-template";
import {
  generateQuotationPdf,
  printQuotationPdf,
} from "@/components/quotation/quotation-pdf-generator";
import { useToast } from "@/components/customer/toast";
import { PreviewDialog } from "@/components/preview/preview-dialog";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatInvoiceMoney } from "@/lib/invoice-calculations";
import { todayStorageDate } from "@/lib/date-format";
import type { InvoiceBillingCustomerOption } from "@/lib/invoice-types";
import {
  buildQuotationDocument,
  createEmptyQuotationItem,
  formatQuotationCustomerAddress,
  quotationCustomerFromSelection,
  suggestQuotationRefNo,
  validateQuotationInput,
} from "@/lib/quotation-calculations";
import type { QuotationFormInput, QuotationItem } from "@/lib/quotation-types";
import { resolveCustomerCompanyName } from "@/lib/invoice-customer-format";

type Props = {
  customers: InvoiceBillingCustomerOption[];
};

export function QuotationForm({ customers }: Props) {
  const toast = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<QuotationFormInput>({
    refNo: "",
    referenceDate: todayStorageDate(),
    quotationDate: todayStorageDate(),
    customerId: "",
    subject: "",
    items: [createEmptyQuotationItem()],
  });

  const selectedCustomer = useMemo(
    () => quotationCustomerFromSelection(form.customerId, customers),
    [form.customerId, customers],
  );

  const documentData = useMemo(
    () => buildQuotationDocument(form, customers),
    [form, customers],
  );

  function updateField<K extends keyof QuotationFormInput>(key: K, value: QuotationFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCustomerChange(customer: InvoiceBillingCustomerOption | null) {
    updateField("customerId", customer?.id ?? "");
  }

  function updateItem(index: number, patch: Partial<QuotationItem>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyQuotationItem()],
    }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length <= 1 ? prev.items : prev.items.filter((_, i) => i !== index),
    }));
  }

  function handleGenerate() {
    const validation = validateQuotationInput(form);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }
    if (!documentData) {
      toast.error("Select a customer.");
      return;
    }
    setShowPreview(true);
  }

  async function runPdfAction(action: "download" | "print") {
    const validation = validateQuotationInput(form);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }
    if (!documentData) {
      toast.error("Select a customer.");
      return;
    }
    setPending(true);
    try {
      if (action === "download") {
        await generateQuotationPdf(documentData);
      } else {
        await printQuotationPdf(documentData);
      }
    } catch {
      toast.error("Failed to generate quotation PDF.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-4">
      <header className="rounded-lg border border-[#D1D5DB] bg-white p-4">
        <h1 className="text-xl font-semibold text-[#111827]">Quotation</h1>
        <p className="text-sm text-[#6B7280]">
          Select a customer, enter subject and items, then generate an instant quotation PDF.
        </p>
      </header>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Reference Date</Label>
            <div className="mt-1">
              <DateInput
                value={form.referenceDate}
                onChange={(value) => updateField("referenceDate", value)}
                aria-label="Reference date"
              />
            </div>
          </div>
          <div>
            <Label>Quotation Date</Label>
            <div className="mt-1">
              <DateInput
                value={form.quotationDate}
                onChange={(value) => updateField("quotationDate", value)}
                aria-label="Quotation date"
              />
            </div>
          </div>
          <div>
            <Label>Ref. No.</Label>
            <div className="mt-1 flex gap-2">
              <Input
                className="flex-1"
                value={form.refNo}
                onChange={(e) => updateField("refNo", e.target.value)}
                placeholder="Enter quotation number"
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => updateField("refNo", suggestQuotationRefNo())}
              >
                Suggest
              </Button>
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Label>Customer</Label>
            <CustomerCombobox
              customers={customers}
              value={form.customerId === "" ? 0 : form.customerId}
              onChange={handleCustomerChange}
            />
          </div>
          {selectedCustomer ? (
            <div className="sm:col-span-2 lg:col-span-3 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-sm">
              <p className="font-semibold text-[#111827]">
                {resolveCustomerCompanyName(selectedCustomer)}
              </p>
              <p className="mt-1 text-[#374151]">GST: {selectedCustomer.gstNumber}</p>
              <p className="mt-1 text-[#374151]">{formatQuotationCustomerAddress(selectedCustomer)}</p>
              <p className="mt-1 text-[#374151]">
                PIN: {selectedCustomer.pincode ?? "—"} · State: {selectedCustomer.state ?? "—"}
              </p>
            </div>
          ) : null}
          <div className="sm:col-span-2 lg:col-span-3">
            <Label>Subject</Label>
            <Input
              className="mt-1"
              value={form.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              placeholder="e.g. Land conversion services"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#111827]">Items</h2>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
        <div className="mt-3 overflow-x-auto rounded border border-[#E5E7EB]">
          <table className="min-w-[640px] w-full text-xs">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="px-2 py-2 text-left w-12">Sl No</th>
                <th className="px-2 py-2 text-left">Description</th>
                <th className="px-2 py-2 text-right w-36">Amount (₹)</th>
                <th className="px-2 py-2 w-16" />
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}>
                  <td className="px-2 py-1.5">{index + 1}</td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, { description: e.target.value })}
                      className="h-8 text-xs"
                      placeholder="Item description"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      step="any"
                      min={0}
                      value={item.amount === 0 ? "" : item.amount}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        updateItem(index, { amount: raw === "" ? 0 : Number(raw) });
                      }}
                      className="h-8 text-right text-xs tabular-nums"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeItem(index)}
                      disabled={form.items.length <= 1}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4 text-[#6B7280]" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {documentData ? (
          <div className="mt-4 grid gap-1 text-right text-sm">
            <p>Subtotal: {formatInvoiceMoney(documentData.totals.subtotal)}</p>
            <p>SGST 9%: {formatInvoiceMoney(documentData.totals.sgst)}</p>
            <p>CGST 9%: {formatInvoiceMoney(documentData.totals.cgst)}</p>
            <p className="font-semibold text-[#111827]">
              Grand Total: {formatInvoiceMoney(documentData.totals.grandTotal)}
            </p>
            <p className="text-xs text-[#6B7280]">{documentData.grandTotalInWords}</p>
          </div>
        ) : null}
      </section>

      <div className="sticky bottom-4 z-10 flex flex-wrap gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button type="button" onClick={handleGenerate}>
          Generate Quotation
        </Button>
      </div>

      <PreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        title="Quotation Preview"
        className="w-[min(100%,220mm)]"
      >
        {documentData ? (
          <div className="space-y-4">
            <QuotationTemplate data={documentData} />
            <div className="no-print flex flex-wrap justify-end gap-2 border-t border-[#E5E7EB] pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => void runPdfAction("print")}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                Print
              </Button>
              <Button type="button" size="sm" disabled={pending} onClick={() => void runPdfAction("download")}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download PDF
              </Button>
            </div>
          </div>
        ) : null}
      </PreviewDialog>
    </div>
  );
}
