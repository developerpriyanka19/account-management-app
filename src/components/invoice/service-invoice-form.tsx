"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Eye, Loader2, Printer, Save } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { saveInvoice } from "@/app/invoice/actions";
import { BankAccountSelect } from "@/components/bank/bank-account-select";
import { CustomerCombobox } from "@/components/invoice/customer-combobox";
import { InvoiceDocumentPreview } from "@/components/invoice/invoice-document-preview";
import {
  generateInvoicePdf,
  printInvoicePdf,
} from "@/components/invoice/invoice-pdf-generator";
import { LocationFarmerSelector } from "@/components/shared/location-farmer-selector";
import { useToast } from "@/components/customer/toast";
import { PreviewDialog } from "@/components/preview/preview-dialog";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatInvoiceDecimal,
  formatInvoiceMoney,
  formatInvoiceNumber,
  formatInvoiceTotalCents,
} from "@/lib/invoice-calculations";
import { gstCustomerToInvoiceCustomer } from "@/lib/invoice-customer-format";
import { todayStorageDate } from "@/lib/date-format";
import type { DocumentLocation } from "@/lib/location-cascade";
import {
  DEFAULT_SERVICE_HSN_SAC_CODE,
  defaultSubtypeForCategory,
  getServiceInvoiceSubtypeConfig,
  normalizeServiceSubtype,
  SERVICE_INVOICE_SUBTYPES,
} from "@/lib/invoice-config";
import {
  bankFromSelection,
  initialBankSelection,
  type BankDetailsOption,
} from "@/lib/bank-details-types";
import {
  computeServiceLineAmounts,
  formatServiceRatePerAcreDisplay,
  prepareServiceInvoiceDocument,
} from "@/lib/service-invoice-layout";
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
  nextSequence: number;
  existing?: InvoiceDocumentData | null;
};

const selectClassName =
  "mt-1 flex h-9 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50";

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
    normalizeServiceSubtype(existing?.subType ?? defaultSubtypeForCategory("service")),
  );
  const initialRate =
    existing?.ratePerAcre && existing.ratePerAcre > 0
      ? String(existing.ratePerAcre)
      : String(
          getServiceInvoiceSubtypeConfig(
            existing?.subType ?? defaultSubtypeForCategory("service"),
          ).ratePerAcre,
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
      hsnSacCode: existing?.hsnSacCode ?? DEFAULT_SERVICE_HSN_SAC_CODE,
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
    overrides?: { subType?: string; rate?: number },
  ) {
    const activeSubType = overrides?.subType ?? subType;
    const activeConfig = getServiceInvoiceSubtypeConfig(activeSubType);
    const rate = overrides?.rate ?? (Number(ratePerAcre) || activeConfig.ratePerAcre);
    setLines((prev) => {
      const next = ids
        .map((id) => farmers.find((f) => f.id === id))
        .filter((f): f is InvoiceFarmerOption => Boolean(f))
        .map((f) => {
          const previous = prev.find((line) => line.farmerId === f.id);
          const line = farmerToInvoiceLine(f, rate);
          return {
            ...line,
            description: activeConfig.serviceName,
            district: location.district,
            taluk: location.taluk,
            village: location.village,
            hobbli: location.hobbli,
            farmerName: f.label,
            // Keep edited IDs on existing lines; new lines stay empty.
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

  function handleLocationUpdate(next: DocumentLocation) {
    form.setValue("state", next.state, { shouldValidate: true });
    form.setValue("district", next.district, { shouldValidate: true });
    form.setValue("taluk", next.taluk, { shouldValidate: true });
    form.setValue("hobbli", next.hobbli, { shouldValidate: true });
    form.setValue("village", next.village, { shouldValidate: true });
  }

  function handleSubTypeChange(nextSubType: string) {
    const normalized = normalizeServiceSubtype(nextSubType);
    setSubType(normalized);
    const config = getServiceInvoiceSubtypeConfig(normalized);
    setRatePerAcre(String(config.ratePerAcre));
    if (selectedFarmerIds.length > 0) {
      syncLines(selectedFarmerIds, locationFilter, {
        subType: normalized,
        rate: config.ratePerAcre,
      });
    }
  }

  function buildDocumentData(
    statusOverride?: string,
    values: FormValues = form.getValues(),
  ): InvoiceDocumentData | null {
    const customer = customers.find((c) => c.id === values.customerId);
    if (!customer || lines.length === 0 || !subType.trim()) return null;
    const config = getServiceInvoiceSubtypeConfig(subType);
    const rate = Number(ratePerAcre) || config.ratePerAcre;
    const computedLines = computeServiceLineAmounts(lines, rate, subType);
    return prepareServiceInvoiceDocument({
      id: existing?.id,
      invoiceType: "service",
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
      totals: { subtotal: 0, sgst: 0, cgst: 0, grandTotal: 0 },
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
    });
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

  const subtypeConfig = getServiceInvoiceSubtypeConfig(subType);
  const displayRate = Number(ratePerAcre) || subtypeConfig.ratePerAcre;
  const displayLines =
    documentData?.lines ?? computeServiceLineAmounts(lines, displayRate, subType);
  const rateLabel = formatServiceRatePerAcreDisplay(displayRate);
  const hsnSacCode = formValues.hsnSacCode?.trim() ?? "";

  function handleCustomerChange(customer: InvoiceBillingCustomerOption | null) {
    if (!customer) {
      form.setValue("customerId", 0, { shouldValidate: true });
      return;
    }
    form.setValue("customerId", customer.id, { shouldValidate: true });
  }

  function handleSave(status: "DRAFT" | "FINAL") {
    if (!subType.trim()) {
      toast.error("Invoice Sub-Type is required.");
      return;
    }
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
          router.push(`/invoice/service/view/${result.id}`);
        } else {
          router.push("/invoice/service");
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
          {existing ? "Edit Service Invoice" : "New Service Invoice"}
        </h1>
        <p className="text-sm text-[#6B7280]">
          Enter invoice number and details manually. Preview opens in modal.
        </p>
      </header>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Invoice Number</Label>
            <div className="mt-1 flex gap-2">
              <Input
                {...form.register("invoiceNumber")}
                placeholder="Enter invoice number"
                className="flex-1"
                disabled={isFinal}
              />
              {!existing && !isFinal ? (
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() =>
                    form.setValue(
                      "invoiceNumber",
                      formatInvoiceNumber("service", nextSequence),
                      { shouldValidate: true },
                    )
                  }
                >
                  Suggest
                </Button>
              ) : null}
            </div>
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
            <Label>Invoice Sub-Type</Label>
            <select
              className={selectClassName}
              value={subType}
              disabled={isFinal}
              onChange={(e) => handleSubTypeChange(e.target.value)}
            >
              {SERVICE_INVOICE_SUBTYPES.map((t) => (
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
              placeholder={DEFAULT_SERVICE_HSN_SAC_CODE}
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
                  setTimeout(
                    () =>
                      syncLines(selectedFarmerIds, locationFilter, {
                        rate: Number(e.target.value) || subtypeConfig.ratePerAcre,
                      }),
                    0,
                  );
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
          <p className="mt-1 text-xs text-[#6B7280]">
            Service: {subtypeConfig.serviceName} · {rateLabel}
          </p>
          <div className="mt-3 overflow-x-auto rounded border border-[#E5E7EB]">
            <table className="min-w-[900px] w-full text-xs">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-2 py-2 text-left" rowSpan={2}>
                    SL NO
                  </th>
                  <th className="px-2 py-2 text-left" rowSpan={2}>
                    Name Of Farmers
                  </th>
                  <th className="px-2 py-2 text-left" rowSpan={2}>
                    HSN/SAC Code
                  </th>
                  <th className="px-2 py-2 text-left" rowSpan={2}>
                    Sy No
                  </th>
                  <th className="px-2 py-2 text-right" rowSpan={2}>
                    Acres
                  </th>
                  <th className="px-2 py-2 text-right" rowSpan={2}>
                    Guntas
                  </th>
                  <th className="px-2 py-2 text-right" rowSpan={2}>
                    Total Cents
                  </th>
                  <th className="px-2 py-2 text-center">{subtypeConfig.serviceName}</th>
                </tr>
                <tr>
                  <th className="px-2 py-2 text-center">{rateLabel}</th>
                </tr>
              </thead>
              <tbody>
                {displayLines.map((line, i) => (
                  <tr
                    key={`${line.farmerId}-${i}`}
                    className={i % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}
                  >
                    <td className="px-2 py-1.5">{i + 1}</td>
                    <td className="px-2 py-1.5">{line.farmerName || line.description}</td>
                    <td className="px-2 py-1.5">{hsnSacCode || "—"}</td>
                    <td className="px-2 py-1.5">{line.surveyNo || "—"}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {formatInvoiceDecimal(line.acres)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {formatInvoiceDecimal(line.gunta)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {formatInvoiceTotalCents(line.totalCents)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {formatInvoiceMoney(line.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {documentData ? (
            <div className="mt-3 space-y-1 text-right text-sm">
              <p>Sub Total: {formatInvoiceMoney(documentData.totals.subtotal)}</p>
              <p>SGST @ 9%: {formatInvoiceMoney(documentData.totals.sgst)}</p>
              <p>CGST @ 9%: {formatInvoiceMoney(documentData.totals.cgst)}</p>
              <p className="font-semibold text-[#111827]">
                Grand Total: {formatInvoiceMoney(documentData.totals.grandTotal)}
              </p>
              <p className="text-xs text-[#6B7280]">{documentData.totalAmountWords}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="sticky bottom-4 z-10 flex flex-wrap gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!documentData || !documentData.hsnSacCode?.trim()}
          onClick={() => setShowPreview(true)}
        >
          <Eye className="h-4 w-4" />
          Preview
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!documentData || !documentData.hsnSacCode?.trim()}
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
          disabled={!documentData || !documentData.hsnSacCode?.trim()}
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
        <Button
          type="button"
          size="sm"
          disabled={pending || isFinal}
          onClick={() => handleSave("FINAL")}
        >
          Save & Generate PDF
        </Button>
      </div>

      <PreviewDialog open={showPreview} onOpenChange={setShowPreview} title="Service Invoice Preview">
        {documentData ? <InvoiceDocumentPreview data={documentData} /> : null}
      </PreviewDialog>
    </div>
  );
}
