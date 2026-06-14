"use server";

import { revalidatePath } from "next/cache";
import {
  amountToIndianWords,
  computeInvoiceTotals,
} from "@/lib/invoice-calculations";
import {
  invoiceCategoryFromType,
  invoiceTypeFromCategory,
  type InvoiceCategoryCode,
} from "@/lib/invoice-category";
import type { InvoiceDocumentData } from "@/lib/invoice-types";
import { resolveBankSnapshotForSave } from "@/actions/bank-details-actions";
import { bankSnapshotToPrismaFields } from "@/lib/bank-details-types";
import { prisma } from "@/lib/prisma";
import { gstCustomerDb } from "@/lib/prisma-gst-customer";
import { countInvoices, invoiceDb } from "@/lib/prisma-invoice";

export type InvoiceListSortField = "date" | "amount";

export type InvoiceListInput = {
  category: InvoiceCategoryCode;
  query?: string;
  page?: number;
  pageSize?: number;
  sort?: InvoiceListSortField;
  sortDir?: "asc" | "desc";
};

function invoiceListWhere(category: InvoiceCategoryCode, query: string) {
  return {
    invoiceCategory: category,
    ...(query
      ? {
          OR: [
            { invoiceNumber: { contains: query, mode: "insensitive" as const } },
            {
              customer: {
                companyName: { contains: query, mode: "insensitive" as const },
              },
            },
            {
              customer: {
                firstName: { contains: query, mode: "insensitive" as const },
              },
            },
            {
              customer: {
                lastName: { contains: query, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };
}

function invoiceListOrderBy(
  sort: InvoiceListSortField,
  sortDir: "asc" | "desc",
): { invoiceDate?: "asc" | "desc"; grandTotal?: "asc" | "desc"; createdAt?: "asc" | "desc" }[] {
  if (sort === "amount") {
    return [{ grandTotal: sortDir }, { createdAt: "desc" }];
  }
  return [{ invoiceDate: sortDir }, { createdAt: "desc" }];
}

export async function getInvoiceList(input: InvoiceListInput) {
  const query = (input.query ?? "").trim();
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 10, 50));
  const page = Math.max(1, input.page ?? 1);
  const sort = input.sort === "amount" ? "amount" : "date";
  const sortDir = input.sortDir === "asc" ? "asc" : "desc";
  const where = invoiceListWhere(input.category, query);

  const [total, rows] = await Promise.all([
    invoiceDb().count({ where }),
    invoiceDb().findMany({
      where,
      orderBy: invoiceListOrderBy(sort, sortDir),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: true },
    }),
  ]);

  return { total, page, pageSize, rows };
}

/** @deprecated Use getInvoiceList({ category: "NA", ... }) */
export async function getNaInvoiceList(input: {
  query?: string;
  page?: number;
  pageSize?: number;
  sort?: InvoiceListSortField;
  sortDir?: "asc" | "desc";
}) {
  return getInvoiceList({ category: "NA", ...input });
}

export async function getServiceInvoiceList(input: {
  query?: string;
  page?: number;
  pageSize?: number;
  sort?: InvoiceListSortField;
  sortDir?: "asc" | "desc";
}) {
  return getInvoiceList({ category: "SERVICE", ...input });
}

export async function getInvoiceBuilderData() {
  const { getActiveBankOptions } = await import("@/actions/bank-details-actions");
  const [customers, farmers, invoiceCount, banks] = await Promise.all([
    gstCustomerDb().findMany({
      orderBy: [{ companyName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gstNumber: true,
        companyName: true,
        buildingNumber: true,
        street: true,
        locality: true,
        village: true,
        taluk: true,
        district: true,
        hobbli: true,
        pincode: true,
        companyAddress: true,
        state: true,
        panNumber: true,
      },
    }),
    prisma.customer.findMany({
      orderBy: { farmerName: "asc" },
      select: {
        id: true,
        farmerName: true,
        vendorCode: true,
        surveyNo: true,
        newSurveyNo: true,
        rtcExtentAcre: true,
        rtcExtentGunta: true,
        balanceExtentAcre: true,
        balanceExtentGunta: true,
        totalCents: true,
      },
    }),
    countInvoices(),
    getActiveBankOptions(),
  ]);

  return {
    customers: customers.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      label:
        c.companyName?.trim() ||
        `${c.firstName} ${c.lastName}`.trim() ||
        c.gstNumber,
      gstNumber: c.gstNumber,
      companyName: c.companyName,
      buildingNumber: c.buildingNumber,
      street: c.street,
      locality: c.locality,
      village: c.village,
      taluk: c.taluk,
      district: c.district,
      hobbli: c.hobbli,
      pincode: c.pincode,
      companyAddress: c.companyAddress,
      state: c.state,
      panNumber: c.panNumber,
    })),
    farmers: farmers
      .filter((f) => f.farmerName?.trim())
      .map((f) => ({
        id: f.id,
        label: f.farmerName!.trim(),
        vendorCode: f.vendorCode,
        surveyNo: f.surveyNo,
        newSurveyNo: f.newSurveyNo,
        rtcExtentAcre: f.rtcExtentAcre,
        rtcExtentGunta: f.rtcExtentGunta,
        balanceExtentAcre: f.balanceExtentAcre,
        balanceExtentGunta: f.balanceExtentGunta,
        totalCents: f.totalCents,
      })),
    nextSequence: invoiceCount + 1,
    banks,
  };
}

function invoiceViewPath(category: InvoiceCategoryCode, id: number): string {
  return category === "NA" ? `/invoice/na/${id}` : `/invoice/${id}`;
}

export async function saveInvoice(
  payload: InvoiceDocumentData,
  status: "DRAFT" | "FINAL",
): Promise<{ ok: true; id: number } | { ok: false; message: string }> {
  if (!payload.customer.id) {
    return { ok: false, message: "Select a customer." };
  }
  if (payload.lines.length === 0) {
    return { ok: false, message: "Add at least one farmer line." };
  }
  if (!payload.bank?.bankDetailsId) {
    return { ok: false, message: "Select a bank account." };
  }

  const bankSnapshot = await resolveBankSnapshotForSave(
    payload.bank.bankDetailsId,
    payload.id ? (await invoiceDb().findUnique({ where: { id: payload.id }, select: { bankDetailsId: true } }))?.bankDetailsId : null,
  );
  if (!bankSnapshot) {
    return { ok: false, message: "Selected bank account is invalid or inactive." };
  }
  const bankFields = bankSnapshotToPrismaFields(bankSnapshot);

  const totals = computeInvoiceTotals(payload.lines);
  const invoiceNumber = payload.invoiceNumber?.trim();
  if (!invoiceNumber) {
    return { ok: false, message: "Invoice number is required." };
  }

  const invoiceCategory = invoiceCategoryFromType(payload.invoiceType);

  try {
    const baseData = {
      invoiceType: payload.invoiceType,
      invoiceCategory,
      subType: payload.subType || (invoiceCategory === "NA" ? "NA Invoice" : "Service Invoice"),
      customerId: payload.customer.id,
      invoiceNumber,
      invoiceDate: payload.invoiceDate,
      district: payload.district || null,
      taluk: payload.taluk || null,
      village: payload.village || null,
      hobbli: payload.hobbli || null,
      status,
      ratePerAcre: payload.ratePerAcre,
      subtotal: totals.subtotal,
      sgst: totals.sgst,
      cgst: totals.cgst,
      grandTotal: totals.grandTotal,
      totalAmountWords: amountToIndianWords(totals.grandTotal),
      notes: payload.notes || null,
      ...bankFields,
    };
    const items = payload.lines.map((line) => ({
      farmerId: line.farmerId,
      district: line.district || payload.district || null,
      taluk: line.taluk || payload.taluk || null,
      village: line.village || null,
      hobbli: line.hobbli || payload.hobbli || null,
      surveyNo: line.surveyNo || null,
      naExtent: line.naExtent || null,
      acres: line.acres,
      gunta: line.gunta,
      totalCents: line.totalCents,
      affidavitId: line.affidavitId || null,
      requestId: line.requestId || null,
      debitNote: Number(line.debitNote) || 0,
      remark: line.remark || null,
      amount: Number(line.debitNote) > 0 ? Number(line.debitNote) : Number(line.amount) || 0,
      description: line.farmerName || line.description || null,
    }));

    const pdfUrl =
      status === "FINAL"
        ? payload.id
          ? invoiceViewPath(invoiceCategory, payload.id)
          : "/pending"
        : null;

    const created = payload.id
      ? await invoiceDb().update({
          where: { id: payload.id },
          data: {
            ...baseData,
            items: {
              deleteMany: {},
              create: items,
            },
            pdfUrl,
          },
        })
      : await invoiceDb().create({
          data: {
            ...baseData,
            items: { create: items },
            pdfUrl,
          },
        });

    if (status === "FINAL") {
      await invoiceDb().update({
        where: { id: created.id },
        data: { pdfUrl: invoiceViewPath(invoiceCategory, created.id) },
      });
    }

    revalidatePath("/invoice/na");
    revalidatePath("/invoice/service");
    revalidatePath("/invoice/bank-details");
    revalidatePath(`/invoice/na/${created.id}`);
    revalidatePath(`/invoice/${created.id}`);

    return { ok: true, id: created.id };
  } catch (e) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code: string }).code)
        : "";
    if (code === "P2002") {
      return { ok: false, message: "This invoice number is already in use." };
    }
    const message = e instanceof Error ? e.message : "Failed to save invoice.";
    return { ok: false, message };
  }
}

export async function deleteInvoice(
  id: number,
  category: InvoiceCategoryCode,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, message: "Invalid invoice." };
  }
  try {
    const existing = await invoiceDb().findFirst({
      where: { id, invoiceCategory: category },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, message: "Invoice not found." };
    }
    await invoiceDb().delete({ where: { id } });
    revalidatePath("/invoice/na");
    revalidatePath("/invoice/service");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete invoice.";
    return { ok: false, message };
  }
}

export async function getInvoiceById(id: number) {
  if (!Number.isInteger(id) || id < 1) return null;
  return invoiceDb().findUnique({
    where: { id },
    include: { customer: true, items: { orderBy: { id: "asc" } } },
  });
}

export async function getNaInvoiceById(id: number) {
  if (!Number.isInteger(id) || id < 1) return null;
  return invoiceDb().findFirst({
    where: { id, invoiceCategory: "NA" },
    include: { customer: true, items: { orderBy: { id: "asc" } } },
  });
}

export async function getServiceInvoiceById(id: number) {
  if (!Number.isInteger(id) || id < 1) return null;
  return invoiceDb().findFirst({
    where: { id, invoiceCategory: "SERVICE" },
    include: { customer: true, items: { orderBy: { id: "asc" } } },
  });
}

export async function listRecentInvoices(category?: InvoiceCategoryCode) {
  const invoiceType = category ? invoiceTypeFromCategory(category) : undefined;
  return invoiceDb().findMany({
    where: category
      ? { invoiceCategory: category }
      : invoiceType
        ? { invoiceType }
        : undefined,
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { customer: true },
  });
}
