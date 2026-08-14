"use client";

import { useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import type {
  InvoiceBillingCustomerOption,
  InvoiceFarmerOption,
} from "@/lib/invoice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/customer/toast";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  invoiceType: string;
  billingCustomers: InvoiceBillingCustomerOption[];
  farmers: InvoiceFarmerOption[];
};

export function InvoiceCreateForm({
  title,
  invoiceType,
  billingCustomers,
  farmers,
}: Props) {
  const toast = useToast();
  const [billingCustomerId, setBillingCustomerId] = useState<number | "">("");
  const [farmerIds, setFarmerIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);

  const selectedCustomer = useMemo(
    () => billingCustomers.find((c) => c.id === billingCustomerId),
    [billingCustomers, billingCustomerId],
  );

  function toggleFarmer(id: number) {
    setFarmerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleGenerate() {
    if (!billingCustomerId) {
      toast.error("Select a billing customer.");
      return;
    }
    if (farmerIds.length === 0) {
      toast.error("Select at least one farmer.");
      return;
    }

    setGenerating(true);
    try {
      // Placeholder until invoice PDF/API is implemented
      await new Promise((r) => setTimeout(r, 600));
      toast.success(
        `Invoice draft prepared (${invoiceType}): customer #${billingCustomerId}, ${farmerIds.length} farmer(s).`,
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[#111827]">{title}</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Step 1: Select billing customer · Step 2: Select farmers · Step 3: Generate
        </p>
      </header>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#111827]">1. Billing customer</h2>
        <p className="mt-1 text-xs text-[#6B7280]">
          GST / company details from the Customer module (not farmer records).
        </p>
        {billingCustomers.length === 0 ? (
          <p className="mt-4 text-sm text-[#D97706]">
            No billing customers yet. Add customers under Invoice → Customers.
          </p>
        ) : (
          <div className="mt-4">
            <Label htmlFor="billingCustomer">Customer</Label>
            <select
              id="billingCustomer"
              value={billingCustomerId}
              onChange={(e) =>
                setBillingCustomerId(e.target.value ? Number(e.target.value) : "")
              }
              className="mt-1 flex h-9 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] shadow-sm focus-visible:border-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/20"
            >
              <option value="">Select customer…</option>
              {billingCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} · {c.gstNumber}
                </option>
              ))}
            </select>
            {selectedCustomer ? (
              <p className="mt-2 text-xs text-[#6B7280]">
                {selectedCustomer.companyName ?? "—"} · GST {selectedCustomer.gstNumber}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#111827]">2. Farmers</h2>
        <p className="mt-1 text-xs text-[#6B7280]">
          Land / survey records from the Farmer module (Dashboard).
        </p>
        {farmers.length === 0 ? (
          <p className="mt-4 text-sm text-[#D97706]">No farmer records available.</p>
        ) : (
          <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto rounded-md border border-[#E5E7EB] p-2">
            {farmers.map((f) => {
              const checked = farmerIds.includes(f.id);
              return (
                <li key={f.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-[#F9FAFB]",
                      checked && "bg-[#EFF6FF]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFarmer(f.id)}
                      className="h-4 w-4 rounded border-[#D1D5DB] text-[#2563EB]"
                    />
                    <span className="font-medium text-[#111827]">{f.label}</span>
                    <span className="text-xs text-[#6B7280]">
                      {[f.vendorCode, f.surveyNo].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-xs text-[#6B7280]">
          {farmerIds.length} farmer{farmerIds.length === 1 ? "" : "s"} selected
        </p>
      </section>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#111827]">3. Generate invoice</h2>
        <div className="mt-4">
          <Label htmlFor="invoiceNotes">Notes (optional)</Label>
          <Textarea
            id="invoiceNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1"
            rows={2}
            placeholder="Additional invoice notes…"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={generating || !billingCustomerId || farmerIds.length === 0}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {generating ? "Generating…" : "Generate Invoice"}
          </Button>
        </div>
      </section>
    </div>
  );
}
