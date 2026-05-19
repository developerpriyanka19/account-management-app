"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  computeInvoiceTotals,
  formatInvoiceNumber,
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
      label:
        c.companyName?.trim() ||
        `${c.firstName} ${c.lastName}`.trim() ||
        c.gstNumber,
      gstNumber: c.gstNumber,
      companyName: c.companyName,
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

export async function saveInvoice(
  payload: InvoiceDocumentData,
  status: "draft" | "final",
): Promise<{ ok: true; id: number } | { ok: false; message: string }> {
  if (!payload.customer.id) {
    return { ok: false, message: "Select a customer." };
  }
  if (payload.lines.length === 0) {
    return { ok: false, message: "Add at least one farmer line." };
  }

  const totals = computeInvoiceTotals(payload.lines);
  const invoiceNumber =
    payload.invoiceNumber ||
    formatInvoiceNumber(payload.invoiceType, Date.now() % 10000);

  try {
    const created = await invoiceDb().create({
      data: {
        invoiceType: payload.invoiceType,
        subType: payload.subType,
        customerId: payload.customer.id,
        invoiceNumber,
        invoiceDate: payload.invoiceDate,
        status,
        ratePerAcre: payload.ratePerAcre,
        subtotal: totals.subtotal,
        sgst: totals.sgst,
        cgst: totals.cgst,
        grandTotal: totals.grandTotal,
        notes: payload.notes || null,
        items: {
          create: payload.lines.map((line) => ({
            farmerId: line.farmerId,
            village: line.village || null,
            surveyNo: line.surveyNo || null,
            naExtent: line.naExtent || null,
            acres: line.acres,
            gunta: line.gunta,
            totalCents: line.totalCents,
            affidavitId: line.affidavitId || null,
            requestId: line.requestId || null,
            amount: line.amount,
            description: line.description || null,
          })),
        },
      },
    });

    revalidatePath("/invoice/na");
    revalidatePath("/invoice/service");
    revalidatePath(`/invoice/${created.id}`);

    if (status === "final") {
      redirect(`/invoice/${created.id}`);
    }

    return { ok: true, id: created.id };
  } catch (e) {
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

export async function listRecentInvoices(category?: "na" | "service") {
  return invoiceDb().findMany({
    where: category ? { invoiceType: category } : undefined,
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { customer: true },
  });
}
