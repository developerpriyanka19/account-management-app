"use server";

import { revalidatePath } from "next/cache";
import {
  amountToIndianWords,
  computeInvoiceTotals,
} from "@/lib/invoice-calculations";
import type { InvoiceDocumentData } from "@/lib/invoice-types";
import { prisma } from "@/lib/prisma";
import { gstCustomerDb } from "@/lib/prisma-gst-customer";
import { countInvoices, invoiceDb } from "@/lib/prisma-invoice";
export async function getInvoiceBuilderData() {
  const [customers, farmers, invoiceCount] = await Promise.all([
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
        district: true,
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
      district: c.district,
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
  };
}

export async function getNaInvoiceList(input: {
  query?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = (input.query ?? "").trim();
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 10, 50));
  const page = Math.max(1, input.page ?? 1);
  const where = {
    invoiceType: "na",
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
  const [total, rows] = await Promise.all([
    invoiceDb().count({ where }),
    invoiceDb().findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: true, items: { take: 1, orderBy: { id: "asc" } } },
    }),
  ]);

  return { total, page, pageSize, rows };
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

  const totals = computeInvoiceTotals(payload.lines);
  const invoiceNumber = payload.invoiceNumber?.trim();
  if (!invoiceNumber) {
    return { ok: false, message: "Invoice number is required." };
  }

  try {
    const baseData = {
      invoiceType: payload.invoiceType,
      subType: payload.subType || "NA Invoice",
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
      debitNote: line.debitNote || 0,
      remark: line.remark || null,
      amount: line.debitNote || line.amount,
      description: line.farmerName || line.description || null,
    }));

    const created = payload.id
      ? await invoiceDb().update({
          where: { id: payload.id },
          data: {
            ...baseData,
            items: {
              deleteMany: {},
              create: items,
            },
            pdfUrl: status === "FINAL" ? `/invoice/na/${payload.id}` : null,
          },
        })
      : await invoiceDb().create({
          data: {
            ...baseData,
            items: { create: items },
            pdfUrl: status === "FINAL" ? "/pending" : null,
          },
        });

    if (status === "FINAL") {
      await invoiceDb().update({
        where: { id: created.id },
        data: { pdfUrl: `/invoice/na/${created.id}` },
      });
    }

    revalidatePath("/invoice/na");
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
    where: { id, invoiceType: "na" },
    include: { customer: true, items: { orderBy: { id: "asc" } } },
  });
}

export async function listRecentInvoices(category?: "na" | "service") {
  return invoiceDb().findMany({
    where: category ? { invoiceType: category } : undefined,
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { customer: true },
  });
}
