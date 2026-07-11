import {
  amountToIndianWords,
  toFiniteNumber,
  type InvoiceTotals,
} from "@/lib/invoice-calculations";
import { toDisplayDate } from "@/lib/date-format";
import { resolveCustomerCompanyName } from "@/lib/invoice-customer-format";
import type { InvoiceBillingCustomerOption } from "@/lib/invoice-types";
import type { QuotationDocument, QuotationFormInput, QuotationItem } from "@/lib/quotation-types";

export function createQuotationItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyQuotationItem(): QuotationItem {
  return { id: createQuotationItemId(), description: "", amount: 0 };
}

const SGST_RATE = 0.09;
const CGST_RATE = 0.09;

export function computeQuotationTotals(items: QuotationItem[]): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => sum + toFiniteNumber(item.amount), 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const sgst = Math.round(roundedSubtotal * SGST_RATE * 100) / 100;
  const cgst = Math.round(roundedSubtotal * CGST_RATE * 100) / 100;
  const grandTotal = Math.round((roundedSubtotal + sgst + cgst) * 100) / 100;
  return { subtotal: roundedSubtotal, sgst, cgst, grandTotal };
}

export function formatQuotationCustomerAddress(customer: InvoiceBillingCustomerOption): string {
  if (customer.companyAddress?.trim()) {
    return customer.companyAddress.trim();
  }
  return [
    customer.buildingNumber,
    customer.street,
    customer.locality,
    customer.village,
    customer.district,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export function quotationCustomerFromSelection(
  customerId: number | "",
  customers: InvoiceBillingCustomerOption[],
): InvoiceBillingCustomerOption | null {
  if (customerId === "") return null;
  return customers.find((c) => c.id === customerId) ?? null;
}

export function buildQuotationDocument(
  input: QuotationFormInput,
  customers: InvoiceBillingCustomerOption[],
): QuotationDocument | null {
  const customer = quotationCustomerFromSelection(input.customerId, customers);
  if (!customer) return null;

  const normalizedItems = input.items.map((item) => ({
    ...item,
    amount: toFiniteNumber(item.amount),
  }));
  const totals = computeQuotationTotals(normalizedItems);

  return {
    refNo: input.refNo.trim(),
    quotationDate: input.quotationDate,
    customerName: resolveCustomerCompanyName(customer),
    customerGst: customer.gstNumber.trim(),
    customerAddress: formatQuotationCustomerAddress(customer),
    pinCode: customer.pincode?.trim() ?? "",
    state: customer.state?.trim() ?? "",
    subject: input.subject.trim(),
    items: normalizedItems,
    totals,
    grandTotalInWords: amountToIndianWords(totals.grandTotal),
  };
}

export type QuotationValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateQuotationInput(input: QuotationFormInput): QuotationValidationResult {
  if (input.customerId === "") {
    return { ok: false, message: "Customer is required." };
  }
  if (!input.subject.trim()) {
    return { ok: false, message: "Subject is required." };
  }
  if (input.items.length === 0) {
    return { ok: false, message: "Add at least one item." };
  }
  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i]!;
    if (!item.description.trim()) {
      return { ok: false, message: `Item ${i + 1}: description is required.` };
    }
    if (toFiniteNumber(item.amount) <= 0) {
      return { ok: false, message: `Item ${i + 1}: amount is required.` };
    }
  }
  return { ok: true };
}

export function suggestQuotationRefNo(date = new Date()): string {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(Math.floor(Math.random() * 9000) + 1000);
  return `QTN-${ymd}-${suffix}`;
}

export function formatQuotationDateDisplay(isoDate: string): string {
  return toDisplayDate(isoDate) || isoDate;
}
