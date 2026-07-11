"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, Loader2, Printer, Save, X } from "lucide-react";
import { useToast } from "@/components/customer/toast";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BankAccountSelect } from "@/components/bank/bank-account-select";
import { LocationFarmerSelector } from "@/components/shared/location-farmer-selector";
import { saveDebitNote, getNextDebitNoteNumber } from "@/actions/debit-note-actions";
import {
  generateDebitNotePdf,
  printDebitNotePdf,
} from "@/components/debit-note/debit-note-pdf-generator";
import { DebitNotePdfPreview } from "@/components/debit-note/debit-note-pdf-preview";
import { PreviewDialog } from "@/components/preview/preview-dialog";
import type {
  AtlPoaRow,
  DebitNoteCustomerOption,
  DebitNoteFarmerOption,
  DebitNotePayload,
  LandConversionRow,
} from "@/lib/debit-note-types";
import { DebitNoteType, isLandConversionStyleDebitNote } from "@/lib/debit-note-types";
import { todayStorageDate } from "@/lib/date-format";
import {
  type DocumentLocation,
  type LocationField,
  validateDocumentLocation,
} from "@/lib/location-cascade";
import {
  bankFromSelection,
  initialBankSelection,
  type BankDetailsOption,
} from "@/lib/bank-details-types";
import {
  DN_ACTION_COL_W,
  DN_ATL_HEADER_H,
  DN_SL_COL_W,
  dnBodyActionStyle,
  dnBodyFarmerStyle,
  dnBodySurveyStyle,
  dnHeaderActionStyle,
  dnHeaderFarmerStyle,
  dnHeaderScrollStyle,
  dnHeaderSurveyStyle,
  dnRowBackground,
} from "@/lib/debit-note-table-sticky";

type Props = {
  type: DebitNoteType;
  title: string;
  nextNumber: string;
  listHref: string;
  customers: DebitNoteCustomerOption[];
  farmers: DebitNoteFarmerOption[];
  banks: BankDetailsOption[];
  existing?: DebitNotePayload;
};

function toNumber(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function buildCustomerAddressLines(customer: DebitNoteCustomerOption | undefined): string[] {
  if (!customer) return [];
  return [
    customer.buildingNumber,
    customer.street,
    customer.locality,
    customer.village,
    customer.district,
    customer.state,
    customer.pincode ? `PIN ${customer.pincode}` : null,
  ].filter((v): v is string => Boolean(v?.trim()));
}

function buildCustomerAddress(customer: DebitNoteCustomerOption | undefined) {
  if (!customer) return "";
  const lines = [
    customer.companyAddress,
    ...buildCustomerAddressLines(customer),
  ].filter(Boolean);
  return lines.join(", ");
}

export function DebitNoteBuilder({
  type,
  title,
  nextNumber,
  listHref,
  customers,
  farmers,
  banks,
  existing,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);
  const [debitNoteId] = useState<number | undefined>(existing?.id);
  const [customerId, setCustomerId] = useState<number | "">(existing?.customerId ?? "");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [customerHighlight, setCustomerHighlight] = useState(0);
  const [debitNoteNo, setDebitNoteNo] = useState(existing?.debitNoteNo ?? "");
  const [date, setDate] = useState(existing?.date ?? todayStorageDate());
  const [state, setState] = useState(existing?.state ?? "");
  const [district, setDistrict] = useState(existing?.district ?? "");
  const [taluk, setTaluk] = useState(existing?.taluk ?? "");
  const [village, setVillage] = useState(existing?.village ?? "");
  const [hobbli, setHobbli] = useState(existing?.hobbli ?? "");
  const [remarks, setRemarks] = useState(existing?.remarks ?? "");
  const [bankDetailsId, setBankDetailsId] = useState<number | "">(() =>
    initialBankSelection(existing?.bank, banks),
  );
  const [rows, setRows] = useState<(LandConversionRow | AtlPoaRow)[]>(existing?.rows ?? []);
  const [pendingFocusRow, setPendingFocusRow] = useState<number | null>(null);
  const [removeRowIndex, setRemoveRowIndex] = useState<number | null>(null);
  const [locationErrors, setLocationErrors] = useState<
    Partial<Record<LocationField, string>>
  >({});
  const [farmerError, setFarmerError] = useState("");
  const customerBoxRef = useRef<HTMLDivElement>(null);

  const location: DocumentLocation = useMemo(
    () => ({ state, district, taluk, hobbli, village }),
    [state, district, taluk, hobbli, village],
  );

  const selectedFarmerIds = useMemo(
    () =>
      rows
        .map((r) => r.farmerId)
        .filter((id): id is number => id != null),
    [rows],
  );

  const locatableFarmers = useMemo(
    () =>
      farmers.map((f) => ({
        id: f.id,
        label: f.farmerName,
        surveyNo: f.surveyNo,
        state: f.state,
        district: f.district,
        taluk: f.taluk,
        hobbli: f.hobbli,
        village: f.village,
      })),
    [farmers],
  );

  const customer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );

  const totals = useMemo(() => {
    const subtotal = rows.reduce((sum, row) => sum + (row.total || 0), 0);
    const gst = subtotal * 0;
    return { subtotal, gst, total: subtotal + gst };
  }, [rows]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 25);
    return customers
      .filter((c) => `${c.label} ${c.gstNumber}`.toLowerCase().includes(q))
      .slice(0, 25);
  }, [customers, customerSearch]);

  useEffect(() => {
    setCustomerHighlight(0);
  }, [customerSearch, showCustomerList]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!customerBoxRef.current?.contains(e.target as Node)) {
        setShowCustomerList(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (pendingFocusRow == null) return;
    const el = document.querySelector<HTMLInputElement>(
      `[data-focus-field="atl"][data-row-index="${pendingFocusRow}"]`,
    );
    if (el) {
      el.focus();
      setPendingFocusRow(null);
    }
  }, [pendingFocusRow, rows.length]);

  const payload: DebitNotePayload | null = useMemo(() => {
    if (!customerId) return null;
    return {
      id: debitNoteId,
      type,
      customerId,
      debitNoteNo,
      date,
      state,
      district,
      taluk,
      village,
      hobbli,
      remarks,
      subtotal: totals.subtotal,
      gst: totals.gst,
      total: totals.total,
      status: "DRAFT",
      rows,
      bank: bankFromSelection(bankDetailsId, banks) ?? existing?.bank ?? {
        bankDetailsId: null,
        bankName: "",
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        branchName: "",
      },
    };
  }, [debitNoteId, type, customerId, debitNoteNo, date, state, district, taluk, village, hobbli, remarks, totals, rows, bankDetailsId, banks, existing?.bank]);

  const pdfCtx = useMemo(
    () => ({
      customerName:
        customer?.companyName?.trim() ||
        customer?.label ||
        "",
      gstNumber: customer?.gstNumber || "",
      address: buildCustomerAddress(customer),
      addressLines: buildCustomerAddressLines(customer),
    }),
    [customer],
  );

  function createRowFromFarmer(f: DebitNoteFarmerOption): LandConversionRow | AtlPoaRow {
    if (isLandConversionStyleDebitNote(type)) {
      return {
        farmerId: f.id,
        farmerName: f.farmerName,
        surveyNo: f.surveyNo || "",
        acres: f.leaseExtentAcre ?? f.rtcExtentAcre ?? null,
        guntas: f.leaseExtentGunta ?? f.rtcExtentGunta ?? null,
        rtcAcre: f.rtcExtentAcre,
        rtcGunta: f.rtcExtentGunta,
        leaseAcre: f.leaseExtentAcre,
        leaseGunta: f.leaseExtentGunta,
        landConversionChallanRefNo: "",
        landConversionFee: 0,
        podiChallanRefNo: "",
        podiFee: 0,
        recoveryChallanRefNo: "",
        recoveryFee: 0,
        total: 0,
        remarks: "",
      };
    }
    return {
      farmerId: f.id,
      farmerName: f.farmerName,
      surveyNo: f.surveyNo || "",
      rtcAcre: f.rtcExtentAcre,
      rtcGunta: f.rtcExtentGunta,
      leaseAcre: f.leaseExtentAcre,
      leaseGunta: f.leaseExtentGunta,
      atlCharges: 0,
      poaCharges: 0,
      chequeNo: "",
      chequeDate: "",
      chequeAmount: 0,
      bankName: "",
      cashAmount: 0,
      total: 0,
      remarks: "",
    };
  }

  function syncRowsFromSelection(ids: number[]) {
    setFarmerError("");
    setRows((prev) => {
      const byFarmer = new Map(
        prev
          .filter((r) => r.farmerId != null)
          .map((r) => [r.farmerId as number, r]),
      );
      const next: (LandConversionRow | AtlPoaRow)[] = [];
      for (const id of ids) {
        const existingRow = byFarmer.get(id);
        if (existingRow) {
          next.push(existingRow);
          continue;
        }
        const farmer = farmers.find((f) => f.id === id);
        if (farmer) next.push(createRowFromFarmer(farmer));
      }
      if (
        !isLandConversionStyleDebitNote(type) &&
        next.length > prev.length
      ) {
        setPendingFocusRow(next.length - 1);
      }
      return next;
    });
  }

  function toggleFarmer(id: number) {
    const next = selectedFarmerIds.includes(id)
      ? selectedFarmerIds.filter((x) => x !== id)
      : [...selectedFarmerIds, id];
    syncRowsFromSelection(next);
  }

  function handleLocationUpdate(next: DocumentLocation) {
    setState(next.state);
    setDistrict(next.district);
    setTaluk(next.taluk);
    setHobbli(next.hobbli);
    setVillage(next.village);
    setLocationErrors((prev) => {
      const cleared = { ...prev };
      delete cleared.state;
      delete cleared.district;
      delete cleared.taluk;
      delete cleared.hobbli;
      delete cleared.village;
      return cleared;
    });
  }

  function selectCustomer(nextId: number) {
    setCustomerId(nextId);
    setCustomerSearch("");
    setShowCustomerList(false);
  }

  function confirmRemoveFarmer() {
    if (removeRowIndex == null) return;
    setRows((prev) => prev.filter((_, i) => i !== removeRowIndex));
    setRemoveRowIndex(null);
  }

  function validateLocationAndFarmers(): boolean {
    const locErrs = validateDocumentLocation(location);
    setLocationErrors(locErrs);
    const hasLocErr = Object.keys(locErrs).length > 0;
    if (hasLocErr) {
      toast.error("Select a complete location before continuing.");
      return false;
    }
    if (selectedFarmerIds.length === 0) {
      setFarmerError("Select at least one farmer.");
      toast.error("Select at least one farmer.");
      return false;
    }
    setFarmerError("");
    return true;
  }

  function farmerNameDisplay(name: string) {
    return <span className="block truncate">{name}</span>;
  }

  function actionCell(rowIndex: number, name: string, rowBg: string) {
    return (
      <td
        className="border border-[#E5E7EB] px-1 py-1.5 text-center"
        style={dnBodyActionStyle(rowBg)}
      >
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={() => setRemoveRowIndex(rowIndex)}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-[#DC2626] hover:bg-[#FEE2E2]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </td>
    );
  }

  function updateLandRow(i: number, patch: Partial<LandConversionRow>) {
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        const row = { ...(r as LandConversionRow), ...patch };
        row.total = (row.landConversionFee || 0) + (row.podiFee || 0) + (row.recoveryFee || 0);
        return row;
      }),
    );
  }

  function updateAtlRow(i: number, patch: Partial<AtlPoaRow>) {
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        const row = { ...(r as AtlPoaRow), ...patch };
        row.total =
          (row.atlCharges || 0) +
          (row.poaCharges || 0) +
          (row.chequeAmount || 0) +
          (row.cashAmount || 0);
        return row;
      }),
    );
  }

  function onSave(status: "DRAFT" | "FINAL") {
    if (!payload) {
      toast.error("Select customer and add rows.");
      return;
    }
    if (!validateLocationAndFarmers()) return;
    if (!payload.bank.bankDetailsId) {
      toast.error("Select a bank account.");
      return;
    }
    startTransition(async () => {
      const result = await saveDebitNote({ ...payload, status });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(status === "DRAFT" ? "Draft saved." : "Debit note saved.");
      router.push(listHref);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4">
      <header className="rounded-lg border border-[#D1D5DB] bg-white p-4">
        <h1 className="text-xl font-semibold text-[#111827]">{title}</h1>
      </header>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Debit Note Number</Label>
            <div className="mt-1 flex gap-2">
              <Input
                value={debitNoteNo}
                onChange={(e) => setDebitNoteNo(e.target.value)}
                placeholder="Enter debit note number"
                className="flex-1"
              />
              {!existing ? (
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => {
                    void getNextDebitNoteNumber(type)
                      .then((suggested) => setDebitNoteNo(suggested))
                      .catch(() => setDebitNoteNo(nextNumber));
                  }}
                >
                  Suggest
                </Button>
              ) : null}
            </div>
          </div>
          <div>
            <Label>Date</Label>
            <div className="mt-1">
              <DateInput
                value={date}
                onChange={(value) => setDate(value)}
                aria-label="Debit note date"
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <Label>Customer</Label>
            <div ref={customerBoxRef} className="relative mt-1">
              <Input
                value={showCustomerList ? customerSearch : customer?.label || ""}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerList(true);
                }}
                onFocus={() => setShowCustomerList(true)}
                onKeyDown={(e) => {
                  if (!showCustomerList && (e.key === "ArrowDown" || e.key === "Enter")) {
                    setShowCustomerList(true);
                    e.preventDefault();
                    return;
                  }
                  if (!showCustomerList) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setCustomerHighlight((i) => Math.min(i + 1, Math.max(0, filteredCustomers.length - 1)));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setCustomerHighlight((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && filteredCustomers[customerHighlight]) {
                    e.preventDefault();
                    selectCustomer(filteredCustomers[customerHighlight]!.id);
                  } else if (e.key === "Escape") {
                    setShowCustomerList(false);
                  }
                }}
                placeholder="Search Customer"
              />
              {showCustomerList ? (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-[#D1D5DB] bg-white shadow-lg">
                  {filteredCustomers.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-[#6B7280]">No customers found.</p>
                  ) : (
                    filteredCustomers.map((c, idx) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c.id)}
                        onMouseEnter={() => setCustomerHighlight(idx)}
                        className={`block w-full border-b border-[#F3F4F6] px-3 py-2 text-left text-xs ${
                          idx === customerHighlight ? "bg-[#EFF6FF]" : "hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <span className="block font-medium">{c.label}</span>
                        <span className="text-[#6B7280]">{c.gstNumber}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <BankAccountSelect
              banks={banks}
              value={bankDetailsId}
              onChange={setBankDetailsId}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <Label>Remark</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="mt-1 min-h-[72px]"
              rows={3}
              placeholder="Optional notes for this debit note"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-4">
        <LocationFarmerSelector
          farmers={locatableFarmers}
          location={location}
          onLocationChange={handleLocationUpdate}
          selectedIds={selectedFarmerIds}
          onToggle={toggleFarmer}
          onSetSelectedIds={syncRowsFromSelection}
          errors={locationErrors}
          farmerError={farmerError}
        />
      </section>

      <section className="rounded-lg border border-[#D1D5DB] bg-white p-4">
        <div className="relative z-0 max-h-[65vh] overflow-auto rounded border border-[#E5E7EB]">
          {isLandConversionStyleDebitNote(type) ? (
            <table
              className="border-separate border-spacing-0 text-xs"
              style={{ minWidth: `${1700 + DN_ACTION_COL_W}px` }}
            >
              <thead>
                <tr>
                  <th
                    className="border-b border-[#E5E7EB] px-2 py-2 text-center font-semibold text-[#374151]"
                    style={{
                      ...dnHeaderScrollStyle(0, "#F9FAFB"),
                      width: DN_SL_COL_W,
                      minWidth: DN_SL_COL_W,
                    }}
                  >
                    Sl No
                  </th>
                  <th
                    className="border-b border-[#E5E7EB] px-2 py-2 text-left font-semibold text-[#374151]"
                    style={dnHeaderFarmerStyle(0, "#F9FAFB")}
                  >
                    Farmer Name
                  </th>
                  <th
                    className="border-b border-[#E5E7EB] px-2 py-2 text-left font-semibold text-[#374151]"
                    style={dnHeaderSurveyStyle(0, "#F9FAFB")}
                  >
                    Survey No
                  </th>
                  <th className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")}>NA Extent Acre</th>
                  <th className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")}>Gunta</th>
                  <th className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2 text-left font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")}>Land Conversion Fee Challan Ref No</th>
                  <th className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")}>Land Conversion Fee</th>
                  <th className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2 text-left font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")}>Podi Fee Challan Ref No</th>
                  <th className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")}>Podi Fee</th>
                  <th className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2 text-left font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")}>Other Recoveries Challan Ref No</th>
                  <th className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")}>Other Recoveries Fee</th>
                  <th className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")}>Total</th>
                  <th
                    className="border-b border-[#E5E7EB] px-2 py-2 text-center font-semibold text-[#374151]"
                    style={dnHeaderActionStyle(0, "#F9FAFB")}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const r = row as LandConversionRow;
                  const rowBg = dnRowBackground(i);
                  return (
                    <tr key={i}>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5 text-center" style={{ backgroundColor: rowBg, width: DN_SL_COL_W, minWidth: DN_SL_COL_W }}>{i + 1}</td>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5" style={dnBodyFarmerStyle(rowBg)}>{farmerNameDisplay(r.farmerName)}</td>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5" style={dnBodySurveyStyle(rowBg)}>{r.surveyNo}</td>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5 text-right" style={{ backgroundColor: rowBg }}>{r.acres ?? "—"}</td>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5 text-right" style={{ backgroundColor: rowBg }}>{r.guntas ?? "—"}</td>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input value={r.landConversionChallanRefNo} onChange={(e) => updateLandRow(i, { landConversionChallanRefNo: e.target.value })} className="h-8" /></td>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input type="number" value={r.landConversionFee} onChange={(e) => updateLandRow(i, { landConversionFee: toNumber(e.target.value) })} className="h-8 text-right" /></td>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input value={r.podiChallanRefNo} onChange={(e) => updateLandRow(i, { podiChallanRefNo: e.target.value })} className="h-8" /></td>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input type="number" value={r.podiFee} onChange={(e) => updateLandRow(i, { podiFee: toNumber(e.target.value) })} className="h-8 text-right" /></td>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input value={r.recoveryChallanRefNo} onChange={(e) => updateLandRow(i, { recoveryChallanRefNo: e.target.value })} className="h-8" /></td>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input type="number" value={r.recoveryFee} onChange={(e) => updateLandRow(i, { recoveryFee: toNumber(e.target.value) })} className="h-8 text-right" /></td>
                      <td className="border-b border-[#E5E7EB] px-2 py-1.5 text-right font-semibold" style={{ backgroundColor: rowBg }}>{r.total.toFixed(2)}</td>
                      {actionCell(i, r.farmerName, rowBg)}
                    </tr>
                  );
                })}
                <tr className="font-semibold">
                  {(() => {
                    const rowBg = dnRowBackground(0, "totals");
                    return (
                      <>
                        <td className="border-b border-[#E5E7EB] px-2 py-2" style={{ backgroundColor: rowBg, width: DN_SL_COL_W, minWidth: DN_SL_COL_W }} />
                        <td className="border-b border-[#E5E7EB] px-2 py-2 text-right" style={dnBodyFarmerStyle(rowBg)}>Totals</td>
                        <td className="border-b border-[#E5E7EB] px-2 py-2" style={dnBodySurveyStyle(rowBg)} />
                        <td className="border-b border-[#E5E7EB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as LandConversionRow).acres || 0), 0).toFixed(2)}
                        </td>
                        <td className="border-b border-[#E5E7EB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as LandConversionRow).guntas || 0), 0).toFixed(2)}
                        </td>
                        <td className="border-b border-[#E5E7EB] px-2 py-2" style={{ backgroundColor: rowBg }} />
                        <td className="border-b border-[#E5E7EB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as LandConversionRow).landConversionFee || 0), 0).toFixed(2)}
                        </td>
                        <td className="border-b border-[#E5E7EB] px-2 py-2" style={{ backgroundColor: rowBg }} />
                        <td className="border-b border-[#E5E7EB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as LandConversionRow).podiFee || 0), 0).toFixed(2)}
                        </td>
                        <td className="border-b border-[#E5E7EB] px-2 py-2" style={{ backgroundColor: rowBg }} />
                        <td className="border-b border-[#E5E7EB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as LandConversionRow).recoveryFee || 0), 0).toFixed(2)}
                        </td>
                        <td className="border-b border-[#E5E7EB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>{totals.total.toFixed(2)}</td>
                        <td className="border-b border-[#E5E7EB] px-2 py-2" style={dnBodyActionStyle(rowBg)} />
                      </>
                    );
                  })()}
                </tr>
              </tbody>
            </table>
          ) : (
            <table
              className="border-separate border-spacing-0 text-xs"
              style={{ minWidth: `${1800 + DN_ACTION_COL_W}px` }}
            >
              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    className="border border-[#D1D5DB] px-2 py-2 text-center font-semibold text-[#374151]"
                    style={{
                      ...dnHeaderScrollStyle(0, "#F9FAFB"),
                      width: DN_SL_COL_W,
                      minWidth: DN_SL_COL_W,
                    }}
                  >
                    Sl No
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-[#D1D5DB] px-2 py-2 text-left font-semibold text-[#374151]"
                    style={dnHeaderFarmerStyle(0, "#F9FAFB")}
                  >
                    Farmer Name
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-[#D1D5DB] px-2 py-2 text-left font-semibold text-[#374151]"
                    style={dnHeaderSurveyStyle(0, "#F9FAFB")}
                  >
                    Survey No
                  </th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-2 text-center font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")} colSpan={2}>RTC Extent</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-2 text-center font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")} colSpan={2}>Lease Extent</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-2 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")}>ATL Charges</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-2 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")}>POA Charges</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-2 text-center font-semibold text-[#374151]" style={dnHeaderScrollStyle(0, "#F9FAFB")} colSpan={5}>AES Pay To Farmers Cheque And Cash</th>
                  <th
                    rowSpan={2}
                    className="border border-[#D1D5DB] px-2 py-2 text-center font-semibold text-[#374151]"
                    style={dnHeaderActionStyle(0, "#F9FAFB")}
                  >
                    Action
                  </th>
                </tr>
                <tr>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-1 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(DN_ATL_HEADER_H, "#F9FAFB")}>Acre</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-1 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(DN_ATL_HEADER_H, "#F9FAFB")}>Gunta</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-1 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(DN_ATL_HEADER_H, "#F9FAFB")}>Acre</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-1 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(DN_ATL_HEADER_H, "#F9FAFB")}>Gunta</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-1" style={dnHeaderScrollStyle(DN_ATL_HEADER_H, "#F9FAFB")} colSpan={2} />
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-1 font-semibold text-[#374151]" style={dnHeaderScrollStyle(DN_ATL_HEADER_H, "#F9FAFB")}>Cheque No</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-1 font-semibold text-[#374151]" style={dnHeaderScrollStyle(DN_ATL_HEADER_H, "#F9FAFB")}>Date</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-1 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(DN_ATL_HEADER_H, "#F9FAFB")}>Amount</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-1 font-semibold text-[#374151]" style={dnHeaderScrollStyle(DN_ATL_HEADER_H, "#F9FAFB")}>Bank Name</th>
                  <th className="border border-[#D1D5DB] bg-[#F9FAFB] px-2 py-1 text-right font-semibold text-[#374151]" style={dnHeaderScrollStyle(DN_ATL_HEADER_H, "#F9FAFB")}>Cash</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const r = row as AtlPoaRow;
                  const rowBg = dnRowBackground(i);
                  return (
                    <tr key={i}>
                      <td className="border border-[#E5E7EB] px-2 py-1.5 text-center" style={{ backgroundColor: rowBg, width: DN_SL_COL_W, minWidth: DN_SL_COL_W }}>{i + 1}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={dnBodyFarmerStyle(rowBg)}>{farmerNameDisplay(r.farmerName)}</td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={dnBodySurveyStyle(rowBg)}><Input value={r.surveyNo} onChange={(e) => updateAtlRow(i, { surveyNo: e.target.value })} className="h-8" /></td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input type="number" value={r.rtcAcre ?? ""} onChange={(e) => updateAtlRow(i, { rtcAcre: e.target.value ? toNumber(e.target.value) : null })} className="h-8 text-right" /></td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input type="number" value={r.rtcGunta ?? ""} onChange={(e) => updateAtlRow(i, { rtcGunta: e.target.value ? toNumber(e.target.value) : null })} className="h-8 text-right" /></td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input type="number" value={r.leaseAcre ?? ""} onChange={(e) => updateAtlRow(i, { leaseAcre: e.target.value ? toNumber(e.target.value) : null })} className="h-8 text-right" /></td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input type="number" value={r.leaseGunta ?? ""} onChange={(e) => updateAtlRow(i, { leaseGunta: e.target.value ? toNumber(e.target.value) : null })} className="h-8 text-right" /></td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input data-focus-field="atl" data-row-index={i} type="number" value={r.atlCharges} onChange={(e) => updateAtlRow(i, { atlCharges: toNumber(e.target.value) })} className="h-8 text-right" /></td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input type="number" value={r.poaCharges} onChange={(e) => updateAtlRow(i, { poaCharges: toNumber(e.target.value) })} className="h-8 text-right" /></td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input value={r.chequeNo} onChange={(e) => updateAtlRow(i, { chequeNo: e.target.value })} className="h-8" /></td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}>
                        <DateInput
                          value={r.chequeDate}
                          onChange={(value) => updateAtlRow(i, { chequeDate: value })}
                          className="h-8"
                          aria-label="Cheque date"
                        />
                      </td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input type="number" value={r.chequeAmount} onChange={(e) => updateAtlRow(i, { chequeAmount: toNumber(e.target.value) })} className="h-8 text-right" /></td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input value={r.bankName} onChange={(e) => updateAtlRow(i, { bankName: e.target.value })} className="h-8" /></td>
                      <td className="border border-[#E5E7EB] px-2 py-1.5" style={{ backgroundColor: rowBg }}><Input type="number" value={r.cashAmount} onChange={(e) => updateAtlRow(i, { cashAmount: toNumber(e.target.value) })} className="h-8 text-right" /></td>
                      {actionCell(i, r.farmerName, rowBg)}
                    </tr>
                  );
                })}
                <tr className="font-semibold">
                  {(() => {
                    const rowBg = dnRowBackground(0, "totals");
                    return (
                      <>
                        <td className="border border-[#D1D5DB] px-2 py-2" style={{ backgroundColor: rowBg, width: DN_SL_COL_W, minWidth: DN_SL_COL_W }} />
                        <td className="border border-[#D1D5DB] px-2 py-2 text-right" style={dnBodyFarmerStyle(rowBg)}>Totals</td>
                        <td className="border border-[#D1D5DB] px-2 py-2" style={dnBodySurveyStyle(rowBg)} />
                        <td className="border border-[#D1D5DB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as AtlPoaRow).rtcAcre || 0), 0).toFixed(2)}
                        </td>
                        <td className="border border-[#D1D5DB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as AtlPoaRow).rtcGunta || 0), 0).toFixed(2)}
                        </td>
                        <td className="border border-[#D1D5DB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as AtlPoaRow).leaseAcre || 0), 0).toFixed(2)}
                        </td>
                        <td className="border border-[#D1D5DB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as AtlPoaRow).leaseGunta || 0), 0).toFixed(2)}
                        </td>
                        <td className="border border-[#D1D5DB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as AtlPoaRow).atlCharges || 0), 0).toFixed(2)}
                        </td>
                        <td className="border border-[#D1D5DB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as AtlPoaRow).poaCharges || 0), 0).toFixed(2)}
                        </td>
                        <td className="border border-[#D1D5DB] px-2 py-2" style={{ backgroundColor: rowBg }} />
                        <td className="border border-[#D1D5DB] px-2 py-2" style={{ backgroundColor: rowBg }} />
                        <td className="border border-[#D1D5DB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as AtlPoaRow).chequeAmount || 0), 0).toFixed(2)}
                        </td>
                        <td className="border border-[#D1D5DB] px-2 py-2" style={{ backgroundColor: rowBg }} />
                        <td className="border border-[#D1D5DB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>
                          {rows.reduce((s, r) => s + ((r as AtlPoaRow).cashAmount || 0), 0).toFixed(2)}
                        </td>
                        <td className="border border-[#D1D5DB] px-2 py-2" style={dnBodyActionStyle(rowBg)} />
                      </>
                    );
                  })()}
                </tr>
                <tr className="font-semibold">
                  {(() => {
                    const rowBg = "#FFFFFF";
                    return (
                      <>
                        <td className="border border-[#D1D5DB] px-2 py-2" style={{ backgroundColor: rowBg, width: DN_SL_COL_W, minWidth: DN_SL_COL_W }} />
                        <td className="border border-[#D1D5DB] px-2 py-2 text-right" style={dnBodyFarmerStyle(rowBg)}>Total Amount</td>
                        <td className="border border-[#D1D5DB] px-2 py-2" style={dnBodySurveyStyle(rowBg)} />
                        <td className="border border-[#D1D5DB] px-2 py-2" style={{ backgroundColor: rowBg }} colSpan={10} />
                        <td className="border border-[#D1D5DB] px-2 py-2 text-right" style={{ backgroundColor: rowBg }}>{totals.total.toFixed(2)}</td>
                        <td className="border border-[#D1D5DB] px-2 py-2" style={dnBodyActionStyle(rowBg)} />
                      </>
                    );
                  })()}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="top-actions no-print sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white/95 p-3 shadow-lg">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!validateLocationAndFarmers()) return;
            setShowPreview(true);
          }}
          disabled={!payload}
        >
          <Eye className="h-4 w-4" /> Preview
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (!payload) return;
            if (!validateLocationAndFarmers()) return;
            void generateDebitNotePdf(payload, pdfCtx);
          }}
          disabled={!payload}
        >
          <Download className="h-4 w-4" /> Download PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!payload) return;
            if (!validateLocationAndFarmers()) return;
            void printDebitNotePdf(payload, pdfCtx);
          }}
          disabled={!payload}
        >
          <Printer className="h-4 w-4" /> Open PDF to Print
        </Button>
        <Button type="button" variant="outline" onClick={() => onSave("DRAFT")} disabled={pending || !payload}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
        </Button>
        <Button type="button" onClick={() => onSave("FINAL")} disabled={pending || !payload}>Save</Button>
      </div>

      <Dialog open={removeRowIndex != null} onOpenChange={(open) => !open && setRemoveRowIndex(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove this farmer from debit note?</DialogTitle>
            <DialogDescription>The farmer will be available to add again from search.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRemoveRowIndex(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#DC2626] text-white hover:bg-[#B91C1C]"
              onClick={confirmRemoveFarmer}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        title="Debit Note Preview"
        className="bg-[#F3F4F6]"
      >
        {payload ? <DebitNotePdfPreview data={payload} ctx={pdfCtx} /> : null}
      </PreviewDialog>
    </div>
  );
}
