"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { customerListWhere } from "@/lib/customer-list-query";
import {
  computeCompanyPaymentTotal,
  computeGovtFeeBreakdown,
} from "@/lib/reports-formulas";
import {
  dateInRange,
  farmerPaymentDate,
  resolveReportPeriod,
  type ReportPeriodFilter,
} from "@/lib/reports-period";
import {
  REPORTS_PAGE_SIZE,
  type FarmerListReportRow,
  type ReportLocationFilter,
} from "@/lib/reports-types";

function locationWhere(filter: ReportLocationFilter): Prisma.CustomerWhereInput {
  const and: Prisma.CustomerWhereInput[] = [];
  if (filter.state?.trim()) and.push({ state: filter.state.trim() });
  if (filter.district?.trim()) and.push({ district: filter.district.trim() });
  if (filter.taluk?.trim()) and.push({ taluk: filter.taluk.trim() });
  if (filter.hobbli?.trim()) and.push({ hobbli: filter.hobbli.trim() });
  if (filter.village?.trim()) and.push({ village: filter.village.trim() });
  const search = customerListWhere(filter.q ?? "");
  if (search) and.push(search);
  if (and.length === 0) return {};
  return { AND: and };
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) set.add(trimmed);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function getReportLocationOptions(filter: ReportLocationFilter = {}) {
  const farmers = await prisma.customer.findMany({
    select: {
      state: true,
      district: true,
      taluk: true,
      hobbli: true,
      village: true,
    },
  });

  const state = filter.state?.trim() ?? "";
  const district = filter.district?.trim() ?? "";
  const taluk = filter.taluk?.trim() ?? "";
  const hobbli = filter.hobbli?.trim() ?? "";

  return {
    states: uniqueSorted(farmers.map((f) => f.state)),
    districts: uniqueSorted(
      farmers
        .filter((f) => !state || (f.state?.trim() ?? "") === state)
        .map((f) => f.district),
    ),
    taluks: uniqueSorted(
      farmers
        .filter(
          (f) =>
            (!state || (f.state?.trim() ?? "") === state) &&
            (!district || (f.district?.trim() ?? "") === district),
        )
        .map((f) => f.taluk),
    ),
    hobblis: uniqueSorted(
      farmers
        .filter(
          (f) =>
            (!state || (f.state?.trim() ?? "") === state) &&
            (!district || (f.district?.trim() ?? "") === district) &&
            (!taluk || (f.taluk?.trim() ?? "") === taluk),
        )
        .map((f) => f.hobbli),
    ),
    villages: uniqueSorted(
      farmers
        .filter(
          (f) =>
            (!state || (f.state?.trim() ?? "") === state) &&
            (!district || (f.district?.trim() ?? "") === district) &&
            (!taluk || (f.taluk?.trim() ?? "") === taluk) &&
            (!hobbli || (f.hobbli?.trim() ?? "") === hobbli),
        )
        .map((f) => f.village),
    ),
  };
}

export async function getFarmerListReport(params: {
  filter: ReportLocationFilter;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = params.pageSize ?? REPORTS_PAGE_SIZE;
  const page = Math.max(1, params.page ?? 1);
  const where = locationWhere(params.filter);

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: [{ farmerName: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        farmerName: true,
        changedFarmerName: true,
        vendorCode: true,
        surveyNo: true,
        newSurveyNo: true,
        state: true,
        district: true,
        taluk: true,
        hobbli: true,
        village: true,
        leaseExtentAcre: true,
        leaseExtentGunta: true,
        rtcExtentAcre: true,
        rtcExtentGunta: true,
        rtcAKharab: true,
        rtcBKharab: true,
      },
    }),
  ]);

  const mapped: FarmerListReportRow[] = rows.map((r) => ({
    id: r.id,
    farmerName: r.farmerName ?? "",
    changedFarmerName: r.changedFarmerName ?? "",
    vendorCode: r.vendorCode ?? "",
    surveyNo: r.surveyNo ?? "",
    newSurveyNo: r.newSurveyNo ?? "",
    state: r.state ?? "",
    district: r.district ?? "",
    taluk: r.taluk ?? "",
    hobbli: r.hobbli ?? "",
    village: r.village ?? "",
    acres: r.leaseExtentAcre ?? r.rtcExtentAcre,
    guntas: r.leaseExtentGunta ?? r.rtcExtentGunta,
    aKharab: r.rtcAKharab,
    bKharab: r.rtcBKharab,
  }));

  return { rows: mapped, total, page, pageSize };
}

export async function getFarmerListReportExport(filter: ReportLocationFilter) {
  const where = locationWhere(filter);
  const rows = await prisma.customer.findMany({
    where,
    orderBy: [{ farmerName: "asc" }, { id: "asc" }],
    select: {
      id: true,
      farmerName: true,
      changedFarmerName: true,
      vendorCode: true,
      surveyNo: true,
      newSurveyNo: true,
      state: true,
      district: true,
      taluk: true,
      hobbli: true,
      village: true,
      leaseExtentAcre: true,
      leaseExtentGunta: true,
      rtcExtentAcre: true,
      rtcExtentGunta: true,
      rtcAKharab: true,
      rtcBKharab: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    farmerName: r.farmerName ?? "",
    changedFarmerName: r.changedFarmerName ?? "",
    vendorCode: r.vendorCode ?? "",
    surveyNo: r.surveyNo ?? "",
    newSurveyNo: r.newSurveyNo ?? "",
    state: r.state ?? "",
    district: r.district ?? "",
    taluk: r.taluk ?? "",
    hobbli: r.hobbli ?? "",
    village: r.village ?? "",
    acres: r.leaseExtentAcre ?? r.rtcExtentAcre,
    guntas: r.leaseExtentGunta ?? r.rtcExtentGunta,
    aKharab: r.rtcAKharab,
    bKharab: r.rtcBKharab,
  }));
}

export async function getFarmerOptionsForReport(query = "") {
  const where = customerListWhere(query);
  const rows = await prisma.customer.findMany({
    where,
    orderBy: [{ farmerName: "asc" }, { id: "asc" }],
    take: 40,
    select: {
      id: true,
      farmerName: true,
      surveyNo: true,
      village: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    label: [r.farmerName, r.surveyNo, r.village].filter(Boolean).join(" · ") || `Farmer #${r.id}`,
  }));
}

export async function getIndividualFarmerReport(farmerId: number) {
  if (!Number.isInteger(farmerId) || farmerId < 1) return null;

  const farmer = await prisma.customer.findUnique({
    where: { id: farmerId },
    include: {
      farmerDebitNotes: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!farmer) return null;

  const [invoiceItems, debitNoteItems] = await Promise.all([
    prisma.invoiceItem.findMany({
      where: { farmerId },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            invoiceType: true,
            subType: true,
            status: true,
            grandTotal: true,
          },
        },
      },
      orderBy: { id: "desc" },
      take: 50,
    }),
    prisma.debitNoteItem.findMany({
      where: { farmerId },
      include: {
        debitNote: {
          select: {
            id: true,
            debitNoteNo: true,
            date: true,
            type: true,
            status: true,
            total: true,
          },
        },
      },
      orderBy: { id: "desc" },
      take: 50,
    }),
  ]);

  const paymentTotal = computeCompanyPaymentTotal(farmer);
  const govtFee = computeGovtFeeBreakdown(farmer);

  return {
    farmer: {
      id: farmer.id,
      farmerName: farmer.farmerName ?? "",
      changedFarmerName: farmer.changedFarmerName ?? "",
      vendorCode: farmer.vendorCode ?? "",
      surveyNo: farmer.surveyNo ?? "",
      newSurveyNo: farmer.newSurveyNo ?? "",
      state: farmer.state ?? "",
      district: farmer.district ?? "",
      taluk: farmer.taluk ?? "",
      hobbli: farmer.hobbli ?? "",
      village: farmer.village ?? "",
      rtcExtentAcre: farmer.rtcExtentAcre,
      rtcExtentGunta: farmer.rtcExtentGunta,
      rtcAKharab: farmer.rtcAKharab,
      rtcBKharab: farmer.rtcBKharab,
      leaseExtentAcre: farmer.leaseExtentAcre,
      leaseExtentGunta: farmer.leaseExtentGunta,
      totalGunta: farmer.totalGunta,
      totalCents: farmer.totalCents,
    },
    paymentSummary: {
      loanAmount: farmer.loanAmount ?? 0,
      leaseAmount: farmer.leaseAmount ?? 0,
      rentalDdPart1Amount: farmer.rentalDdPart1Amount ?? 0,
      aesAdvanceChequeAmount: farmer.aesAdvanceChequeAmount ?? 0,
      shortageChequeAmount: farmer.shortageChequeAmount ?? 0,
      shortageAmountSecondTime: farmer.shortageAmountSecondTime ?? 0,
      shortageThirdChequeAmount: farmer.shortageThirdChequeAmount ?? 0,
      total: paymentTotal,
    },
    govtFeeSummary: govtFee,
    invoices: invoiceItems.map((item) => ({
      id: item.invoice.id,
      invoiceNumber: item.invoice.invoiceNumber,
      invoiceDate: item.invoice.invoiceDate,
      invoiceType: item.invoice.invoiceType,
      subType: item.invoice.subType,
      status: item.invoice.status,
      lineAmount: item.amount,
      grandTotal: item.invoice.grandTotal,
    })),
    debitNotes: debitNoteItems.map((item) => ({
      id: item.debitNote.id,
      debitNoteNo: item.debitNote.debitNoteNo,
      date: item.debitNote.date,
      type: item.debitNote.type,
      status: item.debitNote.status,
      lineTotal: item.total,
      total: item.debitNote.total,
    })),
    legacyDebitNotes: farmer.farmerDebitNotes.map((dn) => ({
      id: dn.id,
      category: dn.category,
      dbNo: dn.dbNo ?? "",
      amount: dn.amount ?? 0,
      remark: dn.remark ?? "",
    })),
  };
}

const paymentSelect = {
  id: true,
  farmerName: true,
  surveyNo: true,
  village: true,
  loanAmount: true,
  leaseAmount: true,
  rentalDdPart1Amount: true,
  aesAdvanceChequeAmount: true,
  shortageChequeAmount: true,
  shortageAmountSecondTime: true,
  shortageThirdChequeAmount: true,
  aesAdvanceDate: true,
  bankLoanDdDate: true,
  rentalDdDate: true,
  rentalDdPart1Date: true,
  createdAt: true,
} as const;

export async function getCompanyPaymentReport(period: ReportPeriodFilter) {
  const range = resolveReportPeriod(period);
  const farmers = await prisma.customer.findMany({
    select: paymentSelect,
    orderBy: [{ farmerName: "asc" }, { id: "asc" }],
  });

  const rows = farmers
    .filter((f) => dateInRange(farmerPaymentDate(f), range))
    .map((f) => {
      const total = computeCompanyPaymentTotal(f);
      return {
        id: f.id,
        farmerName: f.farmerName ?? "",
        surveyNo: f.surveyNo ?? "",
        village: f.village ?? "",
        loanAmount: f.loanAmount ?? 0,
        leaseAmount: f.leaseAmount ?? 0,
        rentalDdPart1Amount: f.rentalDdPart1Amount ?? 0,
        aesAdvanceChequeAmount: f.aesAdvanceChequeAmount ?? 0,
        shortageChequeAmount: f.shortageChequeAmount ?? 0,
        shortageAmountSecondTime: f.shortageAmountSecondTime ?? 0,
        shortageThirdChequeAmount: f.shortageThirdChequeAmount ?? 0,
        total,
        paymentDate: farmerPaymentDate(f),
      };
    })
    .filter((r) => r.total !== 0);

  const totals = rows.reduce(
    (acc, r) => ({
      loanAmount: acc.loanAmount + r.loanAmount,
      leaseAmount: acc.leaseAmount + r.leaseAmount,
      rentalDdPart1Amount: acc.rentalDdPart1Amount + r.rentalDdPart1Amount,
      aesAdvanceChequeAmount: acc.aesAdvanceChequeAmount + r.aesAdvanceChequeAmount,
      shortageChequeAmount: acc.shortageChequeAmount + r.shortageChequeAmount,
      shortageAmountSecondTime: acc.shortageAmountSecondTime + r.shortageAmountSecondTime,
      shortageThirdChequeAmount: acc.shortageThirdChequeAmount + r.shortageThirdChequeAmount,
      total: acc.total + r.total,
    }),
    {
      loanAmount: 0,
      leaseAmount: 0,
      rentalDdPart1Amount: 0,
      aesAdvanceChequeAmount: 0,
      shortageChequeAmount: 0,
      shortageAmountSecondTime: 0,
      shortageThirdChequeAmount: 0,
      total: 0,
    },
  );

  return { rows, totals, range };
}

const govtSelect = {
  id: true,
  farmerName: true,
  surveyNo: true,
  village: true,
  atlTotal: true,
  paoTotal: true,
  landConversion: true,
  otherRecoveries: true,
  podiFee: true,
  leaseDeedStampDuty: true,
  leaseDeedRegCharges: true,
  totalGovtFee: true,
  aesAdvanceDate: true,
  bankLoanDdDate: true,
  rentalDdDate: true,
  rentalDdPart1Date: true,
  createdAt: true,
} as const;

export async function getGovernmentFeeReport(period: ReportPeriodFilter) {
  const range = resolveReportPeriod(period);
  const farmers = await prisma.customer.findMany({
    select: govtSelect,
    orderBy: [{ farmerName: "asc" }, { id: "asc" }],
  });

  const rows = farmers
    .filter((f) => dateInRange(farmerPaymentDate(f), range))
    .map((f) => {
      const fee = computeGovtFeeBreakdown(f);
      return {
        id: f.id,
        farmerName: f.farmerName ?? "",
        surveyNo: f.surveyNo ?? "",
        village: f.village ?? "",
        ...fee,
        paymentDate: farmerPaymentDate(f),
      };
    })
    .filter((r) => r.total !== 0);

  const totals = rows.reduce(
    (acc, r) => ({
      atlTotal: acc.atlTotal + r.atlTotal,
      paoTotal: acc.paoTotal + r.paoTotal,
      landConversion: acc.landConversion + r.landConversion,
      otherRecoveries: acc.otherRecoveries + r.otherRecoveries,
      podiFee: acc.podiFee + r.podiFee,
      leaseDeed: acc.leaseDeed + r.leaseDeed,
      total: acc.total + r.total,
    }),
    {
      atlTotal: 0,
      paoTotal: 0,
      landConversion: 0,
      otherRecoveries: 0,
      podiFee: 0,
      leaseDeed: 0,
      total: 0,
    },
  );

  return { rows, totals, range };
}

export async function importFarmerListReportRows(
  rows: Array<{
    farmerName: string;
    changedFarmerName: string;
    vendorCode: string;
    surveyNo: string;
    newSurveyNo: string;
    state: string;
    district: string;
    taluk: string;
    hobbli: string;
    village: string;
    acres: number | null;
    guntas: number | null;
    aKharab: number | null;
    bKharab: number | null;
  }>,
): Promise<{ ok: true; created: number } | { ok: false; message: string }> {
  if (!rows.length) {
    return { ok: false, message: "No valid rows to import." };
  }

  try {
    await prisma.$transaction(
      rows.map((row) =>
        prisma.customer.create({
          data: {
            farmerName: row.farmerName,
            changedFarmerName: row.changedFarmerName || null,
            vendorCode: row.vendorCode || null,
            surveyNo: row.surveyNo || null,
            newSurveyNo: row.newSurveyNo || null,
            state: row.state,
            district: row.district,
            taluk: row.taluk,
            hobbli: row.hobbli,
            village: row.village,
            leaseExtentAcre: row.acres,
            leaseExtentGunta: row.guntas,
            rtcAKharab: row.aKharab,
            rtcBKharab: row.bKharab,
          },
        }),
      ),
    );
    return { ok: true, created: rows.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return { ok: false, message };
  }
}
