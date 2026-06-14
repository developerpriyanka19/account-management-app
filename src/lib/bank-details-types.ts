export type BankDetailsSnapshot = {
  bankDetailsId?: number | null;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
};

export type BankDetailsRow = {
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
};

export type BankDetailsOption = {
  id: number;
  label: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  isDefault: boolean;
};

export type BankDetailsFormValues = {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  branchName: string;
  isActive: boolean;
  isDefault: boolean;
};

export const BANK_DETAILS_PAGE_SIZE = 10;

export function bankOptionLabel(bank: {
  bankName: string;
  accountHolderName: string;
}): string {
  return `${bank.bankName} - ${bank.accountHolderName}`;
}

export function hasBankSnapshot(bank?: BankDetailsSnapshot | null): boolean {
  if (!bank) return false;
  return Boolean(
    bank.bankName?.trim() ||
      bank.accountHolderName?.trim() ||
      bank.accountNumber?.trim() ||
      bank.ifscCode?.trim(),
  );
}

export function emptyBankSnapshot(): BankDetailsSnapshot {
  return {
    bankDetailsId: null,
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
  };
}

export function snapshotFromRow(row: {
  id: number;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string | null;
}): BankDetailsSnapshot {
  return {
    bankDetailsId: row.id,
    bankName: row.bankName,
    accountHolderName: row.accountHolderName,
    accountNumber: row.accountNumber,
    ifscCode: row.ifscCode,
    branchName: row.branchName ?? "",
  };
}

export function snapshotFromRecord(record: {
  bankDetailsId?: number | null;
  bankName?: string | null;
  accountHolderName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  branchName?: string | null;
}): BankDetailsSnapshot {
  return {
    bankDetailsId: record.bankDetailsId ?? null,
    bankName: record.bankName ?? "",
    accountHolderName: record.accountHolderName ?? "",
    accountNumber: record.accountNumber ?? "",
    ifscCode: record.ifscCode ?? "",
    branchName: record.branchName ?? "",
  };
}

export function snapshotFromOption(option: BankDetailsOption): BankDetailsSnapshot {
  return {
    bankDetailsId: option.id,
    bankName: option.bankName,
    accountHolderName: option.accountHolderName,
    accountNumber: option.accountNumber,
    ifscCode: option.ifscCode,
    branchName: option.branchName,
  };
}

export function initialBankSelection(
  existing: BankDetailsSnapshot | null | undefined,
  banks: BankDetailsOption[],
): number | "" {
  if (existing?.bankDetailsId) return existing.bankDetailsId;
  const def = banks.find((b) => b.isDefault);
  return def?.id ?? "";
}

export function bankFromSelection(
  id: number | "",
  banks: BankDetailsOption[],
): BankDetailsSnapshot | null {
  if (id === "") return null;
  const option = banks.find((b) => b.id === id);
  return option ? snapshotFromOption(option) : null;
}

export function bankSnapshotToPrismaFields(bank: BankDetailsSnapshot) {
  return {
    bankDetailsId: bank.bankDetailsId ?? null,
    bankName: bank.bankName,
    accountHolderName: bank.accountHolderName,
    accountNumber: bank.accountNumber,
    ifscCode: bank.ifscCode,
    branchName: bank.branchName?.trim() || null,
  };
}

export function bankListWhere(query: string) {
  const q = query.trim();
  if (!q) return {};
  return {
    OR: [
      { bankName: { contains: q, mode: "insensitive" as const } },
      { accountHolderName: { contains: q, mode: "insensitive" as const } },
      { accountNumber: { contains: q, mode: "insensitive" as const } },
      { ifscCode: { contains: q, mode: "insensitive" as const } },
    ],
  };
}
