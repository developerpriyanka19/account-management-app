"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { saveInvoice } from "@/app/invoice/actions";
import { BankAccountSelect } from "@/components/bank/bank-account-select";
import { CustomerCombobox } from "@/components/invoice/customer-combobox";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";
import { LocationFarmerSelector } from "@/components/shared/location-farmer-selector";
import { useToast } from "@/components/customer/toast";
import { PreviewDialog } from "@/components/preview/preview-dialog";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  amountToIndianWords,
  computeInvoiceTotals,
  computeLineAmounts,
  formatInvoiceTotalCents,
} from "@/lib/invoice-calculations";
import { gstCustomerToInvoiceCustomer } from "@/lib/invoice-customer-format";
import { todayStorageDate } from "@/lib/date-format";
import type { DocumentLocation } from "@/lib/location-cascade";
import {
  defaultSubtypeForCategory,
  getNaInvoiceSubtypeConfig,
  NA_INVOICE_SUBTYPES,
  normalizeNaSubtype,
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
  poNumber: z.string().trim().min(1, "P.O No is required"),
  poDate: z.string().min(1, "P.O Date is required"),
  hsnSacCode: z.string().trim().min(1, "HSN/SAC Code is required"),
  district: z.string().min(1, "District is required"),
  taluk: z.string().min(1, "Taluk is required"),
  village: z.string().min(1, "Village is required"),
  hobbli: z.string().min(1, "Hobli is required"),
  state: z.string().min(1, "State is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  customers: InvoiceBillingCustomerOption[];
  farmers: InvoiceFarmerOption[];
  banks: BankDetailsOption[];
  existing?: InvoiceDocumentData | null;
};

const selectClassName =
  "mt-1 flex h-9 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50";

export function NaInvoiceForm({ customers, farmers, banks, existing }: Props) {
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
    normalizeNaSubtype(existing?.subType ?? defaultSubtypeForCategory("na")),
  );
  const initialRate =
    existing?.ratePerAcre && existing.ratePerAcre > 0
      ? String(existing.ratePerAcre)
      : String(
          getNaInvoiceSubtypeConfig(
            existing?.subType ?? defaultSubtypeForCategory("na"),
          ).defaultRatePerAcre,
        );
  const [ratePerAcre, setRatePerAcre] = useState(initialRate);
  const [bankDetailsId, setBankDetailsId] = useState<number | "">(() =>
    initialBankSelection(existing?.bank, banks),
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: existing?.customer.id ?? 0,
      invoiceNumber: existing?.invoiceNumber ?? "",
      invoiceDate: existing?.invoiceDate ?? todayStorageDate(),
      poNumber: existing?.poNumber ?? "",
      poDate: existing?.poDate ?? "",
      hsnSacCode: existing?.hsnSacCode ?? "",
      district: existing?.district ?? "",
      taluk: existing?.taluk ?? "",
      village: existing?.village ?? "",
      hobbli: existing?.hobbli ?? "",
      state: existing?.state ?? "",
      notes: existing?.notes ?? "",
    },
  });

  const formValues = form.watch();
  const locationFilter: DocumentLocation = {
    state: formValues.state ?? "",
    district: formValues.district ?? "",
    taluk: formValues.taluk ?? "",
    hobbli: formValues.hobbli ?? "",
    village: formValues.village ?? "",
  };

  const locatableFarmers = useMemo(
    () =>
      farmers.map((f) => ({
        id: f.id,
        label: f.label,
        surveyNo: f.surveyNo,
        newSurveyNo: f.newSurveyNo,
        vendorCode: f.vendorCode,
        state: f.state,
        district: f.district,
        taluk: f.taluk,
        hobbli: f.hobbli,
        village: f.village,
      })),
    [farmers],
  );

  function syncLines(
    ids: number[],
    location: DocumentLocation = locationFilter,
  ) {
    const rate =
      Number(ratePerAcre) || getNaInvoiceSubtypeConfig(subType).defaultRatePerAcre;
    setLines((prev) => {
      const next = ids
        .map((id) => farmers.find((f) => f.id === id))
        .filter((f): f is InvoiceFarmerOption => Boolean(f))
        .map((f) => {
          const previous = prev.find((line) => line.farmerId === f.id);
          const line = farmerToInvoiceLine(f, rate);
          return {
            ...line,
            district: location.district,
            taluk: location.taluk,
            village: location.village,
            hobbli: location.hobbli,
            farmerName: f.label,
            // Keep edited IDs on existing lines; new lines stay empty (not vendorCode).
            affidavitId: previous?.affidavitId ?? "",
            requestId: previous?.requestId ?? "",
            debitNote: previous?.debitNote ?? 0,
            remark: previous?.remark ?? "",
          };
        });
      return next;
    });
  }

  function applyFarmerSelection(ids: number[], location: DocumentLocation) {
    setSelectedFarmerIds(ids);
    syncLines(ids, location);
  }

  function toggleFarmer(id: number) {
    const next = selectedFarmerIds.includes(id)
      ? selectedFarmerIds.filter((x) => x !== id)
      : [...selectedFarmerIds, id];
    applyFarmerSelection(next, locationFilter);
  }

  function setFarmerSelection(ids: number[]) {
    applyFarmerSelection(ids, {
      state: form.getValues("state"),
      district: form.getValues("district"),
      taluk: form.getValues("taluk"),
      hobbli: form.getValues("hobbli"),
      village: form.getValues("village"),
    });
  }

  function updateLine(index: number, patch: Partial<InvoiceLineInput>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function handleLocationUpdate(next: DocumentLocation) {
    form.setValue("state", next.state, { shouldValidate: true });
    form.setValue("district", next.district, { shouldValidate: true });
    form.setValue("taluk", next.taluk, { shouldValidate: true });
    form.setValue("hobbli", next.hobbli, { shouldValidate: true });
    form.setValue("village", next.village, { shouldValidate: true });
  }

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
      poNumber: values.poNumber.trim(),
      poDate: values.poDate,
      district: values.district,
      taluk: values.taluk,
      village: values.village,
      hobbli: values.hobbli,
      state: values.state,
      status: statusOverride ?? existing?.status?.toUpperCase() ?? "DRAFT",
      ratePerAcre: rate,
      hsnSacCode: values.hsnSacCode.trim(),
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
      bank: bankFromSelection(bankDetailsId, banks) ??
        existing?.bank ?? {
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
  }

  function handleSubTypeChange(next: string) {
    const normalized = normalizeNaSubtype(next);
    setSubType(normalized);
    const config = getNaInvoiceSubtypeConfig(normalized);
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
          router.push(`/invoice/na/${result.id}`);
        } else {
          router.push("/invoice/na");
        }
      } catch {
        toast.error("Failed to save invoice. Please try again.");
      }
    });
  }

  const maxDate = todayStorageDate();

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-4">
      <header className="rounded-lg border border-[#D1D5DB] bg-white p-4">
        <h1 className="text-xl font-semibold text-[#111827]">
          {existing ? "Edit NA Invoice" : "New NA Invoice"}
        </h1>
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
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.invoiceNumber.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label>Invoice Date</Label>
            <div className="mt-1">
              <DateInput
                value={form.watch("invoiceDate")}
                onChange={(value) =>
                  form.setValue("invoiceDate", value, { shouldValidate: true })
                }
                maxStorageDate={maxDate}
                disabled={isFinal}
                aria-label="Invoice date"
              />
            </div>
          </div>
          <div>
            <Label>Invoice Type</Label>
            <select
              className={selectClassName}
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
            <Label>P.O No</Label>
            <Input
              {...form.register("poNumber")}
              placeholder="Enter P.O number"
              className="mt-1"
              disabled={isFinal}
            />
            {form.formState.errors.poNumber ? (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.poNumber.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label>P.O Date</Label>
            <div className="mt-1">
              <DateInput
                value={form.watch("poDate")}
                onChange={(value) =>
                  form.setValue("poDate", value, { shouldValidate: true })
                }
                maxStorageDate={maxDate}
                disabled={isFinal}
                aria-label="P.O date"
              />
            </div>
            {form.formState.errors.poDate ? (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.poDate.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label>HSN/SAC Code</Label>
            <Input
              {...form.register("hsnSacCode")}
              placeholder="Enter HSN/SAC code"
              className="mt-1"
              disabled={isFinal}
            />
            {form.formState.errors.hsnSacCode ? (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.hsnSacCode.message}
              </p>
            ) : null}
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
        </div>
      </section>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
        <LocationFarmerSelector
          farmers={locatableFarmers}
          location={locationFilter}
          onLocationChange={handleLocationUpdate}
          selectedIds={selectedFarmerIds}
          onToggle={toggleFarmer}
          onSetSelectedIds={setFarmerSelection}
          disabled={isFinal}
          errors={{
            state: form.formState.errors.state?.message,
            district: form.formState.errors.district?.message,
            taluk: form.formState.errors.taluk?.message,
            hobbli: form.formState.errors.hobbli?.message,
            village: form.formState.errors.village?.message,
          }}
        />
      </section>

      {lines.length > 0 ? (
        <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#111827]">Line Items</h2>
          <div className="mt-3 overflow-x-auto rounded border border-[#E5E7EB]">
            <table className="min-w-[1200px] w-full text-xs">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-2 py-2 text-left">Sl No</th>
                  <th className="px-2 py-2 text-left">Farmer Name</th>
                  <th className="px-2 py-2 text-left">Survey No</th>
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
                  <tr
                    key={`${line.farmerId}-${i}`}
                    className={i % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}
                  >
                    <td className="px-2 py-1.5">{i + 1}</td>
                    <td className="px-2 py-1.5">{line.farmerName || line.description}</td>
                    <td className="px-2 py-1.5">{line.surveyNo}</td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={line.affidavitId}
                        onChange={(e) => updateLine(i, { affidavitId: e.target.value })}
                        className="h-8 text-xs"
                        disabled={isFinal}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={line.requestId}
                        onChange={(e) => updateLine(i, { requestId: e.target.value })}
                        className="h-8 text-xs"
                        disabled={isFinal}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={line.debitNote}
                        onChange={(e) =>
                          updateLine(i, { debitNote: Number(e.target.value) || 0 })
                        }
                        className="h-8 text-right text-xs"
                        disabled={isFinal}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={line.remark}
                        onChange={(e) => updateLine(i, { remark: e.target.value })}
                        className="h-8 text-xs"
                        disabled={isFinal}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">{line.acres ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right">{line.gunta ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right">
                      {line.totalCents != null
                        ? formatInvoiceTotalCents(line.totalCents)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="sticky bottom-4 z-10 flex flex-wrap gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPreview(true)}
          disabled={!documentData}
        >
          Preview
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave("DRAFT")}
          disabled={pending || isFinal}
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSave("FINAL")}
          disabled={pending || isFinal}
        >
          Save & Generate PDF
        </Button>
      </div>

      <PreviewDialog open={showPreview} onOpenChange={setShowPreview} title="Invoice Preview">
        {documentData ? <InvoiceDocumentPreview data={documentData} /> : null}
      </PreviewDialog>
    </div>
  );
}
