"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { debitNoteListPath } from "@/lib/debit-note-routes";
import type { DebitNotePayload, DebitNoteType } from "@/lib/debit-note-types";
import { DebitNoteType as DNType, normalizeDebitNoteType } from "@/lib/debit-note-types";
import { resolveBankSnapshotForSave } from "@/actions/bank-details-actions";
import { bankSnapshotToPrismaFields } from "@/lib/bank-details-types";

export type DebitNoteListSortField = "date" | "amount" | "customer";

export async function getDebitNoteBuilderData() {
  const { getActiveBankOptions } = await import("@/actions/bank-details-actions");
  const [customers, farmers, banks] = await Promise.all([
    prisma.gstCustomer.findMany({
      orderBy: [{ companyName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gstNumber: true,
        companyName: true,
        companyAddress: true,
        buildingNumber: true,
        street: true,
        locality: true,
        village: true,
        taluk: true,
        hobbli: true,
        district: true,
        state: true,
        pincode: true,
      },
    }),
    prisma.customer.findMany({
      orderBy: { farmerName: "asc" },
      select: {
        id: true,
        farmerName: true,
        surveyNo: true,
        rtcExtentAcre: true,
        rtcExtentGunta: true,
        leaseExtentAcre: true,
        leaseExtentGunta: true,
      },
    }),
    getActiveBankOptions(),
  ]);

  return {
    customers: customers.map((c) => ({
      id: c.id,
      label: c.companyName?.trim() || `${c.firstName} ${c.lastName}`.trim() || c.gstNumber,
      gstNumber: c.gstNumber,
      companyName: c.companyName,
      companyAddress: c.companyAddress,
      buildingNumber: c.buildingNumber,
      street: c.street,
      locality: c.locality,
      village: c.village,
      taluk: c.taluk,
      hobbli: c.hobbli,
      district: c.district,
      state: c.state,
      pincode: c.pincode,
    })),
    farmers: farmers
      .filter((f) => f.farmerName?.trim())
      .map((f) => ({
        id: f.id,
        farmerName: f.farmerName!.trim(),
        surveyNo: f.surveyNo,
        rtcExtentAcre: f.rtcExtentAcre,
        rtcExtentGunta: f.rtcExtentGunta,
        leaseExtentAcre: f.leaseExtentAcre,
        leaseExtentGunta: f.leaseExtentGunta,
      })),
    banks,
  };
}

export async function getDebitNoteCustomerOptions() {
  const { customers } = await getDebitNoteBuilderData();
  return customers;
}

export async function getNextDebitNoteNumber(type: DebitNoteType): Promise<string> {
  const prefix = type === DNType.LAND_CONVERSION ? "DNL" : "DAP";
  const count = await prisma.debitNote.count({ where: { type } });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

function debitNoteListOrderBy(sort: DebitNoteListSortField, sortDir: "asc" | "desc") {
  const dir = sortDir;
  if (sort === "amount") return { total: dir };
  if (sort === "customer") {
    return [{ customer: { companyName: dir } }, { customer: { firstName: dir } }];
  }
  return { date: dir };
}

export async function saveDebitNote(
  payload: DebitNotePayload,
): Promise<{ ok: true; id: number } | { ok: false; message: string }> {
  if (!payload.customerId) return { ok: false, message: "Customer is required." };
  if (!payload.debitNoteNo.trim()) return { ok: false, message: "Debit note number is required." };
  if (payload.rows.length === 0) return { ok: false, message: "Add at least one row." };
  if (!payload.bank?.bankDetailsId) {
    return { ok: false, message: "Select a bank account." };
  }

  const bankSnapshot = await resolveBankSnapshotForSave(
    payload.bank.bankDetailsId,
    payload.id
      ? (await prisma.debitNote.findUnique({ where: { id: payload.id }, select: { bankDetailsId: true } }))
          ?.bankDetailsId
      : null,
  );
  if (!bankSnapshot) {
    return { ok: false, message: "Selected bank account is invalid or inactive." };
  }
  const bankFields = bankSnapshotToPrismaFields(bankSnapshot);

  try {
    const base = {
      type: payload.type,
      customerId: payload.customerId,
      debitNoteNo: payload.debitNoteNo.trim(),
      date: payload.date,
      district: payload.district || null,
      taluk: payload.taluk || null,
      village: payload.village || null,
      hobbli: payload.hobbli || null,
      subtotal: payload.subtotal,
      gst: payload.gst,
      total: payload.total,
      remarks: payload.remarks || null,
      status: payload.status,
      ...bankFields,
    };

    const items = payload.rows.map((row) => {
      const common = {
        farmerId: row.farmerId,
        farmerName: row.farmerName || null,
        surveyNo: row.surveyNo || null,
        remarks: row.remarks || null,
        total: row.total || 0,
      };
      if (payload.type === DNType.LAND_CONVERSION) {
        const r = row as {
          acres: number | null;
          guntas: number | null;
          landConversionFee: number;
          podiFee: number;
          recoveryFee: number;
          landConversionChallanRefNo?: string;
          podiChallanRefNo?: string;
          recoveryChallanRefNo?: string;
        };
        return {
          ...common,
          acres: r.acres,
          guntas: r.guntas,
          landConversionChallanRefNo: r.landConversionChallanRefNo || null,
          landConversionFee: r.landConversionFee || 0,
          podiChallanRefNo: r.podiChallanRefNo || null,
          podiFee: r.podiFee || 0,
          recoveryChallanRefNo: r.recoveryChallanRefNo || null,
          recoveryFee: r.recoveryFee || 0,
        };
      }
      const r = row as {
        rtcAcre: number | null;
        rtcGunta: number | null;
        leaseAcre: number | null;
        leaseGunta: number | null;
        atlCharges: number;
        poaCharges: number;
        chequeNo: string;
        chequeDate: string;
        chequeAmount: number;
        bankName: string;
        cashAmount: number;
      };
      return {
        ...common,
        rtcAcre: r.rtcAcre,
        rtcGunta: r.rtcGunta,
        leaseAcre: r.leaseAcre,
        leaseGunta: r.leaseGunta,
        atlCharges: r.atlCharges || 0,
        poaCharges: r.poaCharges || 0,
        chequePart1No: r.chequeNo || null,
        chequePart1Date: r.chequeDate || null,
        chequePart1Amount: r.chequeAmount || 0,
        chequePart1BankName: r.bankName || null,
        cashAmount: r.cashAmount || 0,
      };
    });

    const result = payload.id
      ? await prisma.debitNote.update({
          where: { id: payload.id },
          data: {
            ...base,
            items: {
              deleteMany: {},
              create: items,
            },
          },
        })
      : await prisma.debitNote.create({
          data: {
            ...base,
            items: {
              create: items,
            },
          },
        });

    const listPath = debitNoteListPath(normalizeDebitNoteType(payload.type));
    revalidatePath(listPath);
    revalidatePath(`${listPath}/create`);
    revalidatePath(`/debit-note/${result.id}`);

    return { ok: true, id: result.id };
  } catch (error) {
    console.error("saveDebitNote failed", error);
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "P2002") {
      return { ok: false, message: "Debit note number already exists." };
    }
    if (code === "P2003") {
      return { ok: false, message: "Invalid customer/farmer reference. Please reselect and save again." };
    }
    const message = error instanceof Error ? error.message : "Failed to save debit note.";
    return { ok: false, message };
  }
}

export async function getDebitNoteList(input: {
  type: DebitNoteType;
  query?: string;
  status?: "DRAFT" | "FINAL" | "all";
  customerId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sort?: DebitNoteListSortField;
  sortDir?: "asc" | "desc";
}) {
  const query = (input.query ?? "").trim();
  const status = input.status ?? "all";
  const dateFrom = (input.dateFrom ?? "").trim();
  const dateTo = (input.dateTo ?? "").trim();
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 10, 50));
  const page = Math.max(1, input.page ?? 1);
  const sort = input.sort === "amount" || input.sort === "customer" ? input.sort : "date";
  const sortDir = input.sortDir === "asc" ? "asc" : "desc";

  const where = {
    type: input.type,
    ...(status !== "all" ? { status } : {}),
    ...(input.customerId ? { customerId: input.customerId } : {}),
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
    ...(query
      ? {
          OR: [
            { debitNoteNo: { contains: query, mode: "insensitive" as const } },
            { village: { contains: query, mode: "insensitive" as const } },
            { customer: { companyName: { contains: query, mode: "insensitive" as const } } },
            { customer: { firstName: { contains: query, mode: "insensitive" as const } } },
            { customer: { lastName: { contains: query, mode: "insensitive" as const } } },
            { items: { some: { farmerName: { contains: query, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.debitNote.count({ where }),
    prisma.debitNote.findMany({
      where,
      orderBy: debitNoteListOrderBy(sort, sortDir),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: {
          select: {
            companyName: true,
            firstName: true,
            lastName: true,
            gstNumber: true,
          },
        },
      },
    }),
  ]);

  return { total, page, pageSize, rows };
}

export async function getDebitNoteById(id: number) {
  if (!Number.isInteger(id) || id < 1) return null;
  return prisma.debitNote.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          gstNumber: true,
          companyName: true,
          companyAddress: true,
          buildingNumber: true,
          street: true,
          locality: true,
          village: true,
          district: true,
          state: true,
          pincode: true,
        },
      },
      items: { orderBy: { id: "asc" } },
    },
  });
}

export async function deleteDebitNote(
  id: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, message: "Invalid debit note id." };
  }
  try {
    const record = await prisma.debitNote.findUnique({
      where: { id },
      select: { type: true },
    });
    await prisma.debitNote.delete({ where: { id } });
    if (record) {
      const listPath = debitNoteListPath(normalizeDebitNoteType(record.type));
      revalidatePath(listPath);
    }
    revalidatePath("/debit-note/land-conversion");
    revalidatePath("/debit-note/atl-poa-gpa");
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to delete debit note." };
  }
}
