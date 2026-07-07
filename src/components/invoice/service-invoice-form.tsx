"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Download, Eye, Loader2, Printer, Save } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { saveInvoice } from "@/app/invoice/actions";
import { BankAccountSelect } from "@/components/bank/bank-account-select";
import { CustomerCombobox } from "@/components/invoice/customer-combobox";
import { FarmerSearchList } from "@/components/invoice/farmer-search-list";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";
import {
  generateInvoicePdf,
  printInvoicePdf,
} from "@/components/invoice/invoice-pdf-generator";
import { useToast } from "@/components/customer/toast";
import { PreviewDialog } from "@/components/preview/preview-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  amountToIndianWords,
  computeInvoiceTotals,
  computeLineAmounts,
  formatInvoiceMoney,
  formatInvoiceNumber,
} from "@/lib/invoice-calculations";
import { gstCustomerToInvoiceCustomer } from "@/lib/invoice-customer-format";
import {
  defaultSubtypeForCategory,
  SERVICE_INVOICE_SUBTYPES,
} from "@/lib/invoice-config";
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
import { farmerToInvoiceLine } from "@/lib/invoice-types";

const schema = z.object({
  customerId: z.number().int().positive("Customer is required"),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  district: z.string().min(1, "District is required"),
  taluk: z.string().min(1, "Taluk is required"),
  village: z.string().min(1, "Village is required"),
  hobbli: z.string().min(1, "Hobbli is required"),
  state: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  customers: InvoiceBillingCustomerOption[];
  farmers: InvoiceFarmerOption[];
  banks: BankDetailsOption[];
  nextSequence: number;
  existing?: InvoiceDocumentData | null;
};

function todayDate() {
  return format(new Date(), "yyyy-MM-dd");
}

export function ServiceInvoiceForm({
  customers,
  farmers,
  banks,
  nextSequence,
  existing,
}: Props) {
  const isFinal = (existing?.status ?? "").toUpperCase() === "FINAL";
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFarmerIds, setSelectedFarmerIds] = useState<number[]>(
    (existing?.lines.map((l) => l.farmerId ?? 0).filter(Boolean) as number[]) ?? [],
  );
  const [lines, setLines] = useState<InvoiceLineInput[]>(existing?.lines ?? []);
  const [subType, setSubType] = useState(
    existing?.subType ?? defaultSubtypeForCategory("service"),
  );
  const [ratePerAcre, setRatePerAcre] = useState(
    existing?.ratePerAcre && existing.ratePerAcre > 0
      ? String(existing.ratePerAcre)
      : "500",
  );
  const [bankDetailsId, setBankDetailsId] = useState<number | "">(() =>
    initialBankSelection(existing?.bank, banks),
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: existing?.customer.id ?? 0,
      invoiceNumber:
        existing?.invoiceNumber ?? formatInvoiceNumber("service", nextSequence),
      invoiceDate: existing?.invoiceDate ?? todayDate(),
      district: existing?.district ?? "",
      taluk: existing?.taluk ?? "",
      village: existing?.village ?? "",
      hobbli: existing?.hobbli ?? "",
      state: existing?.state ?? "",
      notes: existing?.notes ?? "",
    },
  });

  function syncLines(ids: number[]) {
    const baseDistrict = form.getValues("district");
    const baseTaluk = form.getValues("taluk");
    const baseVillage = form.getValues("village");
    const baseHobbli = form.getValues("hobbli");
    const rate = Number(ratePerAcre) || 0;
    const next = ids
      .map((id) => farmers.find((f) => f.id === id))
      .filter((f): f is InvoiceFarmerOption => Boolean(f))
      .map((f) => {
        const prior = lines.find((line) => line.farmerId === f.id);
        const base = farmerToInvoiceLine(f, rate);
        return {
          ...base,
          description: prior?.description ?? f.label,
          farmerName: f.label,
          district: baseDistrict,
          taluk: baseTaluk,
          village: baseVillage || base.village,
          hobbli: baseHobbli,
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
    const rate = Number(ratePerAcre) || 0;
    const computedLines = computeLineAmounts(lines, rate, "service");
    const totals = computeInvoiceTotals(computedLines);
    return {
      id: existing?.id,
      invoiceType: "service",
      subType,
      invoiceNumber: values.invoiceNumber.trim(),
      invoiceDate: values.invoiceDate,
      district: values.district,
      taluk: values.taluk,
      village: values.village,
      hobbli: values.hobbli,
      state: values.state ?? "",
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
      bank: bankFromSelection(bankDetailsId, banks) ?? existing?.bank ?? {
        bankDetailsId: null,
        bankName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
      },
    };
  }

  const documentData = useMemo(
    () => buildDocumentData(undefined, formValues),
    [
      customers,
      existing?.id,
      existing?.pdfUrl,
      existing?.status,
      existing?.bank,
      formValues,
      lines,
      subType,
      ratePerAcre,
      bankDetailsId,
      banks,
    ],
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
    form.setValue("state", customer.state ?? "");
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
    if (!payload.bank.bankDetailsId) {
      toast.error("Select a bank account.");
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
          router.push(`/invoice/${result.id}`);
        } else {
          router.push("/invoice/service");
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
        <h1 className="text-xl font-semibold text-[#111827]">
          {existing ? "Edit Service Invoice" : "New Service Invoice"}
        </h1>
        <p className="text-sm text-[#6B7280]">
          Enter invoice details, select farmers, and set line amounts manually.
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
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.invoiceNumber.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label>Invoice Date</Label>
            <Input
              type="date"
              max={maxDate}
              {...form.register("invoiceDate")}
              className="mt-1"
              disabled={isFinal}
            />
          </div>
          <div>
            <Label>Invoice Sub-Type</Label>
            <select
              className="mt-1 flex h-9 w-full rounded-md border border-[#E5E7EB] px-3 text-sm"
              value={subType}
              disabled={isFinal}
              onChange={(e) => setSubType(e.target.value)}
            >
              {SERVICE_INVOICE_SUBTYPES.map((t) => (
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
          <div className="sm:col-span-2 lg:col-span-3">
            <BankAccountSelect
              banks={banks}
              value={bankDetailsId}
              onChange={setBankDetailsId}
              disabled={isFinal}
            />
          </div>
          <div>
            <Label>Hobli</Label>
            <Input className="mt-1" {...form.register("hobbli")} disabled={isFinal} />
          </div>
          <div>
            <Label>Village</Label>
            <Input className="mt-1" {...form.register("village")} disabled={isFinal} />
          </div>
          <div>
            <Label>Taluk</Label>
            <Input className="mt-1" {...form.register("taluk")} disabled={isFinal} />
          </div>
          <div>
            <Label>District</Label>
            <Input className="mt-1" {...form.register("district")} disabled={isFinal} />
          </div>
          <div>
            <Label>State</Label>
            <Input className="mt-1" {...form.register("state")} disabled={isFinal} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#111827]">Farmers</h2>
        <p className="mt-1 text-xs text-[#6B7280]">
          Search by farmer name, survey number, or village. Selected farmers stay checked while you
          search.
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
            <table className="min-w-[720px] w-full text-xs">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-2 py-2 text-left">Sl No</th>
                  <th className="px-2 py-2 text-left">Farmer Name</th>
                  <th className="px-2 py-2 text-left">Description</th>
                  <th className="px-2 py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(documentData?.lines ?? computeLineAmounts(lines, Number(ratePerAcre) || 0, "service")).map(
                  (line, i) => (
                  <tr key={`${line.farmerId}-${i}`} className={i % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}>
                    <td className="px-2 py-1.5">{i + 1}</td>
                    <td className="px-2 py-1.5">{line.farmerName || line.description}</td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(i, { description: e.target.value })}
                        className="h-8 text-xs"
                        disabled={isFinal}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {formatInvoiceMoney(line.amount)}
                    </td>
                  </tr>
                  ),
                )}
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

      <div className="sticky bottom-4 z-10 flex flex-wrap gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-lg backdrop-blur">
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
          disabled={!documentData}
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
          Print
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || isFinal}
          onClick={() => handleSave("DRAFT")}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Draft
        </Button>
        <Button type="button" size="sm" disabled={pending || isFinal} onClick={() => handleSave("FINAL")}>
          Save & View
        </Button>
      </div>

      <PreviewDialog open={showPreview} onOpenChange={setShowPreview} title="Service Invoice Preview">
        {documentData ? <InvoiceDocumentPreview data={documentData} /> : null}
      </PreviewDialog>
    </div>
  );
}
