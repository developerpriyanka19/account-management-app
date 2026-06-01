"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, Save, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { saveInvoice } from "@/app/invoice/actions";
import { CustomerCombobox } from "@/components/invoice/customer-combobox";
import { FarmerSearchList } from "@/components/invoice/farmer-search-list";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";
import { useToast } from "@/components/customer/toast";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  amountToIndianWords,
  computeInvoiceTotals,
  computeLineAmounts,
} from "@/lib/invoice-calculations";
import { gstCustomerToInvoiceCustomer } from "@/lib/invoice-customer-format";
import {
  defaultSubtypeForCategory,
  getNaInvoiceSubtypeConfig,
  NA_INVOICE_SUBTYPES,
} from "@/lib/invoice-config";
import type {
  InvoiceBillingCustomerOption,
  InvoiceDocumentData,
  InvoiceFarmerOption,
  InvoiceLineInput,
} from "@/lib/invoice-types";
import { farmerToInvoiceLine } from "@/lib/invoice-types";

const schema = z.object({
  customerId: z.number().int().positive("Customer is required"),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  district: z.string().min(1, "District is required"),
  taluk: z.string().min(1, "Taluk is required"),
  village: z.string().min(1, "Village is required"),
  hobbli: z.string().min(1, "Hobbli is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  customers: InvoiceBillingCustomerOption[];
  farmers: InvoiceFarmerOption[];
  existing?: InvoiceDocumentData | null;
};

function todayDate() {
  return format(new Date(), "yyyy-MM-dd");
}

export function NaInvoiceForm({ customers, farmers, existing }: Props) {
  const isFinal = (existing?.status ?? "").toUpperCase() === "FINAL";
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFarmerIds, setSelectedFarmerIds] = useState<number[]>(
    existing?.lines.map((l) => l.farmerId ?? 0).filter(Boolean) as number[] ?? [],
  );
  const [lines, setLines] = useState<InvoiceLineInput[]>(existing?.lines ?? []);
  const [subType, setSubType] = useState(
    existing?.subType ?? defaultSubtypeForCategory("na"),
  );
  const initialRate =
    existing?.ratePerAcre && existing.ratePerAcre > 0
      ? String(existing.ratePerAcre)
      : String(getNaInvoiceSubtypeConfig(existing?.subType ?? defaultSubtypeForCategory("na")).defaultRatePerAcre);
  const [ratePerAcre, setRatePerAcre] = useState(initialRate);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: existing?.customer.id ?? 0,
      invoiceNumber: existing?.invoiceNumber ?? "",
      invoiceDate: existing?.invoiceDate ?? todayDate(),
      district: existing?.district ?? "",
      taluk: existing?.taluk ?? "",
      village: existing?.village ?? "",
      hobbli: existing?.hobbli ?? "",
      notes: existing?.notes ?? "",
    },
  });

  function syncLines(ids: number[]) {
    const baseDistrict = form.getValues("district");
    const baseTaluk = form.getValues("taluk");
    const baseVillage = form.getValues("village");
    const baseHobbli = form.getValues("hobbli");
    const rate = Number(ratePerAcre) || getNaInvoiceSubtypeConfig(subType).defaultRatePerAcre;
    const next = ids
      .map((id) => farmers.find((f) => f.id === id))
      .filter((f): f is InvoiceFarmerOption => Boolean(f))
      .map((f) => {
        const line = farmerToInvoiceLine(f, rate);
        return {
          ...line,
          district: baseDistrict,
          taluk: baseTaluk,
          village: baseVillage || line.village,
          hobbli: baseHobbli,
          farmerName: f.label,
          debitNote: line.debitNote || 0,
          remark: line.remark || "",
        };
      });
    setLines(next);
  }

  function toggleFarmer(id: number) {
    setSelectedFarmerIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      syncLines(next);
      return next;
    });
  }

  function updateLine(index: number, patch: Partial<InvoiceLineInput>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  const formValues = form.watch();

  function buildDocumentData(
    statusOverride?: string,
    values: FormValues = form.getValues(),
  ): InvoiceDocumentData | null {
    const customer = customers.find((c) => c.id === values.customerId);
    if (!customer || lines.length === 0) return null;
    const rate =
      Number(ratePerAcre) || getNaInvoiceSubtypeConfig(subType).defaultRatePerAcre;
    const computedLines = computeLineAmounts(lines, rate, "na");
    const totals = computeInvoiceTotals(computedLines);
    return {
      id: existing?.id,
      invoiceType: "na",
      subType,
      invoiceNumber: values.invoiceNumber.trim(),
      invoiceDate: values.invoiceDate,
      district: values.district,
      taluk: values.taluk,
      village: values.village,
      hobbli: values.hobbli,
      status: statusOverride ?? existing?.status?.toUpperCase() ?? "DRAFT",
      ratePerAcre: rate,
      notes: values.notes ?? "",
      totalAmountWords: amountToIndianWords(totals.grandTotal),
      customer: gstCustomerToInvoiceCustomer({
        id: customer.id,
        companyName: customer.companyName,
        firstName: "",
        lastName: "",
        gstNumber: customer.gstNumber,
        buildingNumber: customer.buildingNumber,
        street: customer.street,
        locality: customer.locality,
        village: customer.village,
        district: customer.district,
        pincode: customer.pincode,
        state: customer.state,
        panNumber: customer.panNumber,
      }),
      lines: computedLines,
      totals,
      pdfUrl: existing?.pdfUrl,
    };
  }

  const documentData = useMemo(
    () => buildDocumentData(undefined, formValues),
    [customers, existing?.id, existing?.pdfUrl, existing?.status, formValues, lines, subType, ratePerAcre],
  );

  function handleCustomerChange(customer: InvoiceBillingCustomerOption | null) {
    if (!customer) {
      form.setValue("customerId", 0, { shouldValidate: true });
      return;
    }
    form.setValue("customerId", customer.id, { shouldValidate: true });
    form.setValue("district", customer.district ?? "");
    form.setValue("taluk", customer.taluk ?? "");
    form.setValue("village", customer.village ?? "");
    form.setValue("hobbli", customer.hobbli ?? "");
    if (selectedFarmerIds.length > 0) {
      syncLines(selectedFarmerIds);
    }
  }

  function handleSubTypeChange(next: string) {
    setSubType(next);
    const config = getNaInvoiceSubtypeConfig(next);
    setRatePerAcre(String(config.defaultRatePerAcre));
    if (selectedFarmerIds.length > 0) {
      syncLines(selectedFarmerIds);
    }
  }

  function handleSave(status: "DRAFT" | "FINAL") {
    const parsed = schema.safeParse(form.getValues());
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fill required fields.");
      return;
    }
    const payload = buildDocumentData(status);
    if (!payload) {
      toast.error("Select a customer and at least one farmer.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveInvoice(payload, status);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(status === "DRAFT" ? "Draft saved." : "Invoice saved and PDF ready.");
        if (status === "FINAL") {
          router.push(`/invoice/na/${result.id}`);
        } else {
          router.push("/invoice/na");
        }
      } catch {
        toast.error("Failed to save invoice. Please try again.");
      }
    });
  }

  const maxDate = todayDate();

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-4">
      <header className="rounded-lg border border-[#D1D5DB] bg-white p-4">
        <h1 className="text-xl font-semibold text-[#111827]">{existing ? "Edit NA Invoice" : "New NA Invoice"}</h1>
        <p className="text-sm text-[#6B7280]">
          Enter invoice number and details manually. Preview opens in modal.
        </p>
      </header>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Invoice Number</Label>
            <Input
              {...form.register("invoiceNumber")}
              placeholder="Enter invoice number"
              className="mt-1"
              disabled={isFinal}
            />
            {form.formState.errors.invoiceNumber ? (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.invoiceNumber.message}</p>
            ) : null}
          </div>
          <div>
            <Label>Invoice Date</Label>
            <Input type="date" max={maxDate} {...form.register("invoiceDate")} className="mt-1" disabled={isFinal} />
          </div>
          <div>
            <Label>Invoice Type</Label>
            <select
              className="mt-1 flex h-9 w-full rounded-md border border-[#E5E7EB] px-3 text-sm"
              value={subType}
              disabled={isFinal}
              onChange={(e) => handleSubTypeChange(e.target.value)}
            >
              {NA_INVOICE_SUBTYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Rate per Acre (₹)</Label>
            <Input
              type="number"
              min={0}
              className="mt-1"
              value={ratePerAcre}
              disabled={isFinal}
              onChange={(e) => {
                setRatePerAcre(e.target.value);
                if (selectedFarmerIds.length > 0) {
                  setTimeout(() => syncLines(selectedFarmerIds), 0);
                }
              }}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Label>Customer</Label>
            <CustomerCombobox
              customers={customers}
              value={form.watch("customerId")}
              onChange={handleCustomerChange}
              disabled={isFinal}
              error={form.formState.errors.customerId?.message}
            />
          </div>
          <div><Label>District</Label><Input className="mt-1" {...form.register("district")} disabled={isFinal} /></div>
          <div><Label>Taluk</Label><Input className="mt-1" {...form.register("taluk")} disabled={isFinal} /></div>
          <div><Label>Village</Label><Input className="mt-1" {...form.register("village")} disabled={isFinal} /></div>
          <div><Label>Hobbli</Label><Input className="mt-1" {...form.register("hobbli")} disabled={isFinal} /></div>
        </div>
      </section>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#111827]">Farmers</h2>
        <p className="mt-1 text-xs text-[#6B7280]">
          Search by farmer name, survey number, or village. Selected farmers stay checked while you search.
        </p>
        <FarmerSearchList
          farmers={farmers}
          selectedIds={selectedFarmerIds}
          onToggle={toggleFarmer}
          disabled={isFinal}
        />
      </section>

      {lines.length > 0 ? (
        <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#111827]">Line Items</h2>
          <div className="mt-3 overflow-x-auto rounded border border-[#E5E7EB]">
            <table className="min-w-[1600px] w-full text-xs">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-2 py-2 text-left">Sl No</th>
                  <th className="px-2 py-2 text-left">Farmer Name</th>
                  <th className="px-2 py-2 text-left">Survey No</th>
                  <th className="px-2 py-2 text-left">District</th>
                  <th className="px-2 py-2 text-left">Taluk</th>
                  <th className="px-2 py-2 text-left">Village</th>
                  <th className="px-2 py-2 text-left">Hobbli</th>
                  <th className="px-2 py-2 text-left">Affidavit ID</th>
                  <th className="px-2 py-2 text-left">Request ID</th>
                  <th className="px-2 py-2 text-right">Debit Note</th>
                  <th className="px-2 py-2 text-left">Remark</th>
                  <th className="px-2 py-2 text-right">Acres</th>
                  <th className="px-2 py-2 text-right">Guntas</th>
                  <th className="px-2 py-2 text-right">Total Cents</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={`${line.farmerId}-${i}`} className={i % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}>
                    <td className="px-2 py-1.5">{i + 1}</td>
                    <td className="px-2 py-1.5">{line.farmerName || line.description}</td>
                    <td className="px-2 py-1.5">{line.surveyNo}</td>
                    <td className="px-2 py-1.5"><Input value={line.district} onChange={(e) => updateLine(i, { district: e.target.value })} className="h-8 text-xs" disabled={isFinal} /></td>
                    <td className="px-2 py-1.5"><Input value={line.taluk} onChange={(e) => updateLine(i, { taluk: e.target.value })} className="h-8 text-xs" disabled={isFinal} /></td>
                    <td className="px-2 py-1.5"><Input value={line.village} onChange={(e) => updateLine(i, { village: e.target.value })} className="h-8 text-xs" disabled={isFinal} /></td>
                    <td className="px-2 py-1.5"><Input value={line.hobbli} onChange={(e) => updateLine(i, { hobbli: e.target.value })} className="h-8 text-xs" disabled={isFinal} /></td>
                    <td className="px-2 py-1.5"><Input value={line.affidavitId} onChange={(e) => updateLine(i, { affidavitId: e.target.value })} className="h-8 text-xs" disabled={isFinal} /></td>
                    <td className="px-2 py-1.5"><Input value={line.requestId} onChange={(e) => updateLine(i, { requestId: e.target.value })} className="h-8 text-xs" disabled={isFinal} /></td>
                    <td className="px-2 py-1.5"><Input type="number" value={line.debitNote} onChange={(e) => updateLine(i, { debitNote: Number(e.target.value) || 0 })} className="h-8 text-right text-xs" disabled={isFinal} /></td>
                    <td className="px-2 py-1.5"><Input value={line.remark} onChange={(e) => updateLine(i, { remark: e.target.value })} className="h-8 text-xs" disabled={isFinal} /></td>
                    <td className="px-2 py-1.5 text-right">{line.acres ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right">{line.gunta ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right">{line.totalCents ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="sticky bottom-4 z-10 flex flex-wrap gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button type="button" variant="outline" onClick={() => setShowPreview(true)} disabled={!documentData}>
          Preview
        </Button>
        <Button type="button" variant="outline" onClick={() => handleSave("DRAFT")} disabled={pending || isFinal}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Draft
        </Button>
        <Button type="button" onClick={() => handleSave("FINAL")} disabled={pending || isFinal}>
          Save & Generate PDF
        </Button>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent
          className="w-[min(100%,220mm)] max-h-[90vh] overflow-x-hidden overflow-y-auto"
          onEscapeKeyDown={() => setShowPreview(false)}
          onPointerDownOutside={() => setShowPreview(false)}
        >
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute right-10 top-4"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </DialogClose>
          </DialogHeader>
          {documentData ? <InvoiceDocumentPreview data={documentData} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
