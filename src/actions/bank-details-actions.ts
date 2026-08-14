"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  BANK_DETAILS_PAGE_SIZE,
  bankListWhere,
  bankOptionLabel,
  snapshotFromRow,
  type BankDetailsFormValues,
  type BankDetailsOption,
  type BankDetailsRow,
  type BankDetailsSnapshot,
} from "@/lib/bank-details-types";

function normalizeIfsc(code: string): string {
  return code.trim().toUpperCase();
}

function validateForm(
  values: BankDetailsFormValues,
): { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string> } {
  const bankName = values.bankName.trim();
  const accountHolderName = values.accountHolderName.trim();
  const accountNumber = values.accountNumber.trim();
  const confirmAccountNumber = values.confirmAccountNumber.trim();
  const ifscCode = normalizeIfsc(values.ifscCode);

  const fieldErrors: Record<string, string> = {};
  if (!bankName) fieldErrors.bankName = "Bank name is required.";
  if (!accountHolderName) fieldErrors.accountHolderName = "Account holder name is required.";
  if (!accountNumber) fieldErrors.accountNumber = "Account number is required.";
  if (!confirmAccountNumber) fieldErrors.confirmAccountNumber = "Confirm account number is required.";
  if (accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber) {
    fieldErrors.confirmAccountNumber = "Account numbers do not match.";
  }
  if (!ifscCode) fieldErrors.ifscCode = "IFSC code is required.";
  else if (ifscCode.length !== 11) fieldErrors.ifscCode = "IFSC code must be 11 characters.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
  }
  return { ok: true };
}

function toRow(record: {
  id: number;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}): BankDetailsRow {
  return { ...record };
}

export async function getBankDetailsList(input: { query?: string; page?: number }) {
  const query = (input.query ?? "").trim();
  const page = Math.max(1, input.page ?? 1);
  const where = bankListWhere(query);

  const [total, rows] = await Promise.all([
    prisma.bankDetail.count({ where }),
    prisma.bankDetail.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { bankName: "asc" }],
      skip: (page - 1) * BANK_DETAILS_PAGE_SIZE,
      take: BANK_DETAILS_PAGE_SIZE,
    }),
  ]);

  return {
    total,
    page,
    pageSize: BANK_DETAILS_PAGE_SIZE,
    rows: rows.map(toRow),
  };
}

export async function getBankDetailById(id: number): Promise<BankDetailsRow | null> {
  if (!Number.isInteger(id) || id < 1) return null;
  const row = await prisma.bankDetail.findUnique({ where: { id } });
  return row ? toRow(row) : null;
}

export async function getActiveBankOptions(): Promise<BankDetailsOption[]> {
  const rows = await prisma.bankDetail.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" }, { bankName: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    label: bankOptionLabel(r),
    bankName: r.bankName,
    accountHolderName: r.accountHolderName,
    accountNumber: r.accountNumber,
    ifscCode: r.ifscCode,
    branchName: r.branchName ?? "",
    isDefault: r.isDefault,
  }));
}

export async function getDefaultBankId(): Promise<number | null> {
  const row = await prisma.bankDetail.findFirst({
    where: { isActive: true, isDefault: true },
    select: { id: true },
  });
  return row?.id ?? null;
}

export async function resolveBankSnapshot(
  bankDetailsId: number | null | undefined,
): Promise<BankDetailsSnapshot | null> {
  if (!bankDetailsId) return null;
  const row = await prisma.bankDetail.findFirst({
    where: { id: bankDetailsId, isActive: true },
  });
  if (!row) return null;
  return snapshotFromRow(row);
}

/** Resolve bank for save; allows inactive bank when re-saving the same linked account on edit. */
export async function resolveBankSnapshotForSave(
  bankDetailsId: number | null | undefined,
  previousBankDetailsId?: number | null,
): Promise<BankDetailsSnapshot | null> {
  const active = await resolveBankSnapshot(bankDetailsId);
  if (active) return active;
  if (!bankDetailsId || previousBankDetailsId !== bankDetailsId) return null;
  const row = await prisma.bankDetail.findUnique({ where: { id: bankDetailsId } });
  return row ? snapshotFromRow(row) : null;
}

async function clearOtherDefaults(exceptId?: number) {
  await prisma.bankDetail.updateMany({
    where: exceptId ? { id: { not: exceptId }, isDefault: true } : { isDefault: true },
    data: { isDefault: false },
  });
}

export async function createBankDetail(
  values: BankDetailsFormValues,
): Promise<{ ok: true; id: number } | { ok: false; message: string; fieldErrors?: Record<string, string> }> {
  const validation = validateForm(values);
  if (!validation.ok) return validation;

  try {
    if (values.isDefault) await clearOtherDefaults();

    const created = await prisma.bankDetail.create({
      data: {
        bankName: values.bankName.trim(),
        accountHolderName: values.accountHolderName.trim(),
        accountNumber: values.accountNumber.trim(),
        ifscCode: normalizeIfsc(values.ifscCode),
        branchName: values.branchName.trim() || null,
        isActive: values.isActive,
        isDefault: values.isDefault,
      },
    });

    revalidatePath("/invoice/bank-details");
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, message: "Failed to create bank details." };
  }
}

export async function updateBankDetail(
  id: number,
  values: BankDetailsFormValues,
): Promise<{ ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string> }> {
  if (!Number.isInteger(id) || id < 1) return { ok: false, message: "Invalid bank id." };
  const validation = validateForm(values);
  if (!validation.ok) return validation;

  try {
    if (values.isDefault) await clearOtherDefaults(id);

    await prisma.bankDetail.update({
      where: { id },
      data: {
        bankName: values.bankName.trim(),
        accountHolderName: values.accountHolderName.trim(),
        accountNumber: values.accountNumber.trim(),
        ifscCode: normalizeIfsc(values.ifscCode),
        branchName: values.branchName.trim() || null,
        isActive: values.isActive,
        isDefault: values.isDefault,
      },
    });

    revalidatePath("/invoice/bank-details");
    revalidatePath(`/invoice/bank-details/${id}/edit`);
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to update bank details." };
  }
}

export async function setDefaultBankDetail(
  id: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!Number.isInteger(id) || id < 1) return { ok: false, message: "Invalid bank id." };
  try {
    await clearOtherDefaults(id);
    await prisma.bankDetail.update({
      where: { id },
      data: { isDefault: true, isActive: true },
    });
    revalidatePath("/invoice/bank-details");
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to set default bank." };
  }
}

export async function deleteBankDetail(
  id: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!Number.isInteger(id) || id < 1) return { ok: false, message: "Invalid bank id." };

  const [invoiceCount, debitNoteCount] = await Promise.all([
    prisma.invoice.count({ where: { bankDetailsId: id } }),
    prisma.debitNote.count({ where: { bankDetailsId: id } }),
  ]);

  if (invoiceCount + debitNoteCount > 0) {
    return {
      ok: false,
      message:
        "This bank account is already used in documents and cannot be deleted. You can mark it inactive instead.",
    };
  }

  try {
    await prisma.bankDetail.delete({ where: { id } });
    revalidatePath("/invoice/bank-details");
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to delete bank details." };
  }
}
