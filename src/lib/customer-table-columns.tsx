import type { ColumnDef } from "@tanstack/react-table";
import type { CustomerListRow } from "@/lib/customer-list-format";
import {
  cellText,
  formatAmount,
  formatIntegerAmount,
  formatOptionalDate,
} from "@/lib/customer-display";
import {
  computeFarmerDerivedFields,
  formatTotalCents,
  roundToThreeDecimals,
  roundToTwoDecimals,
  type FarmerDerivedFields,
} from "@/lib/customer-computed-totals";
import {
  EXPORT_GROUPS,
  LEAF_COLUMN_IDS,
  type ExportGroup,
  type LeafColumnId,
} from "@/lib/customer-column-layout";

export { EXPORT_GROUPS, LEAF_COLUMN_IDS, type ExportGroup, type LeafColumnId };

export const HEADER_ROW_H = 44;

export const FARMER_DETAILS_GROUP_ID = "farmerDetails";
export const ACTIONS_GROUP_ID = "actionsGroup";
export const ACTIONS_COLUMN_ID = "actions";
export const ACTIONS_COLUMN_WIDTH = 160;

export const PINNED_LEFT = [
  "farmerName",
  "changedFarmerName",
  "vendorCode",
  "surveyNo",
  "newSurveyNo",
] as const;
export const PINNED_RIGHT = [ACTIONS_COLUMN_ID] as const;

export const FARMER_DETAILS_LEAF_IDS = [
  "farmerName",
  "changedFarmerName",
  "vendorCode",
  "surveyNo",
  "newSurveyNo",
] as const;

type CustomerColumnMeta = {
  suppressSubHeader?: boolean;
  headerTone?: "red";
};

function columnGroup(
  groupId: string,
  parentLabel: string,
  leaf: ColumnDef<CustomerListRow>,
  opts?: { subHeader?: string | null; headerTone?: "red" },
): ColumnDef<CustomerListRow> {
  const suppressSubHeader = opts?.subHeader === null;
  const subHeader = suppressSubHeader ? "" : (opts?.subHeader ?? parentLabel);
  return {
    id: groupId,
    header: parentLabel,
    meta: opts?.headerTone ? { headerTone: opts.headerTone } : undefined,
    columns: [
      {
        ...leaf,
        header: subHeader,
        meta: {
          ...((leaf.meta as CustomerColumnMeta | undefined) ?? {}),
          suppressSubHeader,
        },
      },
    ],
  };
}


export function tableTotalWidth(
  leafColumns: { id: string; columnDef: { size?: number } }[],
): number {
  return leafColumns.reduce((sum, col) => sum + (col.columnDef.size ?? 100), 0);
}

export function pinnedLeftTotalWidth(
  leafColumns: { id: string; columnDef: { size?: number } }[],
): number {
  return PINNED_LEFT.reduce((sum, id) => {
    const col = leafColumns.find((c) => c.id === id);
    if (!col) return sum;
    return sum + (col.columnDef.size ?? 100);
  }, 0);
}

export function farmerDetailsGroupWidth(
  leafColumns: { id: string; columnDef: { size?: number } }[],
): number {
  return FARMER_DETAILS_LEAF_IDS.reduce((sum, id) => {
    const col = leafColumns.find((c) => c.id === id);
    if (!col) return sum;
    return sum + (col.columnDef.size ?? 100);
  }, 0);
}

const AMOUNT_CELL_INNER =
  "amount-cell block text-right font-mono tabular-nums whitespace-normal break-words leading-snug [overflow-wrap:anywhere]";

function amountCellSpan(text: string, tone: "empty" | "extent" | "money", negative = false) {
  if (tone === "empty") {
    return <span className={`${AMOUNT_CELL_INNER} text-[#6B7280]`}>—</span>;
  }
  if (tone === "extent") {
    return <span className={`${AMOUNT_CELL_INNER} text-[#111827]`}>{text}</span>;
  }
  return (
    <span
      className={`${AMOUNT_CELL_INNER} ${negative ? "text-[#DC2626]" : "text-[#16A34A] font-semibold"}`}
    >
      {text}
    </span>
  );
}

function extentCell(value: number | null | undefined) {
  const text = formatAmount(value);
  if (text === "—") return amountCellSpan(text, "empty");
  return amountCellSpan(text, "extent");
}

function moneyCell(value: number | null | undefined) {
  const text = formatAmount(value);
  if (text === "—") return amountCellSpan(text, "empty");
  const negative = value != null && value < 0;
  return amountCellSpan(text, "money", negative);
}

function integerMoneyCell(value: number | null | undefined) {
  const text = formatIntegerAmount(value);
  if (text === "—") return amountCellSpan(text, "empty");
  const negative = value != null && value < 0;
  return amountCellSpan(text, "money", negative);
}

function textCell(value: string | null | undefined) {
  const text = cellText(value);
  return (
    <span className="block min-w-0 truncate text-[#111827]" title={text !== "—" ? text : undefined}>
      {text}
    </span>
  );
}

function remarkCell(value: string | null | undefined) {
  const text = cellText(value);
  return (
    <span
      className="block min-w-0 whitespace-normal break-words leading-snug text-[#111827]"
      title={text !== "—" ? text : undefined}
    >
      {text}
    </span>
  );
}

function dateCell(value: string | null | undefined) {
  return <span className="text-[#6B7280]">{formatOptionalDate(value)}</span>;
}

export function computeLeaseDeedGovtFee(row: CustomerListRow): number | null {
  const stamp = row.leaseDeedStampDuty;
  const reg = row.leaseDeedRegCharges;
  if (stamp == null && reg == null) return null;
  const total = (stamp ?? 0) + (reg ?? 0);
  return Number.isNaN(total) ? null : total;
}

function farmerDerivedFromRow(row: CustomerListRow): FarmerDerivedFields {
  return computeFarmerDerivedFields({
    leaseExtentAcre: row.leaseExtentAcre,
    leaseExtentGunta: row.leaseExtentGunta,
    rentPerAcre: row.rentPerAcre,
    aesAdvanceChequeAmount: row.aesAdvanceChequeAmount,
    shortageChequeAmount: row.shortageChequeAmount,
    shortageAmountSecondTime: row.shortageAmountSecondTime,
    shortageThirdChequeAmount: row.shortageThirdChequeAmount,
    atlTotal: row.atlTotal,
    paoTotal: row.paoTotal,
    landConversion: row.landConversion,
    otherRecoveries: row.otherRecoveries,
    podiFee: row.podiFee,
    leaseDeedStampDuty: row.leaseDeedStampDuty,
    leaseDeedRegCharges: row.leaseDeedRegCharges,
  });
}

const COMPUTED_COLUMN_IDS = new Set<string>([
  "totalGunta",
  "totalCents",
  "rentAmount",
  "balanceRentAmount",
  "shortageAmountTotal",
  "totalGovtFee",
]);

function computedColumnCell(row: CustomerListRow, field: keyof FarmerDerivedFields) {
  const value = farmerDerivedFromRow(row)[field];
  if (field === "totalCents") {
    const text = formatTotalCents(value);
    if (!text) return amountCellSpan("—", "empty");
    return amountCellSpan(text, "extent");
  }
  return moneyCell(roundToTwoDecimals(value));
}

/** Leaf column ids in Excel export order (derived from grouped headers). */
export const EXPORT_LEAF_COLUMN_IDS = EXPORT_GROUPS.flatMap(
  (g) => g.leafIds,
) as LeafColumnId[];

const MONEY_IDS = new Set<string>([
  "totalGunta",
  "totalCents",
  "rentPerAcre",
  "noOfYears",
  "rentAmount",
  "aesAdvanceChequeAmount",
  "balanceRentAmount",
  "loanAmount",
  "leaseAmount",
  "tdsAmount",
  "shortageChequeAmount",
  "shortageAmountSecondTime",
  "shortageThirdChequeAmount",
  "shortageAmountTotal",
  "rentalDdPart1Amount",
  "atlTotal",
  "paoTotal",
  "landConversion",
  "otherRecoveries",
  "podiFee",
  "leaseDeedGovtFee",
  "totalGovtFee",
  "debitNoteAmount",
  "otherCharges",
  "cropCompensation",
  "rtcExtentAcre",
  "rtcExtentGunta",
  "rtcAKharab",
  "rtcBKharab",
  "balanceExtentAcre",
  "balanceExtentGunta",
  "leaseExtentAcre",
  "leaseExtentGunta",
]);

const DATE_IDS = new Set([
  "aesAdvanceDate",
  "bankLoanDdDate",
  "rentalDdDate",
  "rentalDdPart1Date",
  "shortageDate",
  "shortageSecondDate",
  "shortageThirdDate",
]);

/** Leaf column ids rendered as right-aligned currency / numeric amounts in the table. */
export const MONEY_COLUMN_IDS = MONEY_IDS;

export function getExportCellValue(row: CustomerListRow, id: LeafColumnId): string | number {
  if (id === "remark") {
    const t = cellText(row.notes);
    return t === "—" ? "" : t;
  }
  if (id === "leaseDeedGovtFee") {
    const v = computeLeaseDeedGovtFee(row);
    if (v == null || Number.isNaN(v)) return "";
    return v;
  }
  if (COMPUTED_COLUMN_IDS.has(id)) {
    const derived = farmerDerivedFromRow(row);
    if (id === "totalCents") {
      return roundToThreeDecimals(derived.totalCents);
    }
    return roundToTwoDecimals(derived[id as keyof FarmerDerivedFields]);
  }
  const v = row[id as keyof CustomerListRow];
  if (DATE_IDS.has(id)) {
    const t = formatOptionalDate(v as string | null);
    return t === "—" ? "" : t;
  }
  if (id === "cropCompensation") {
    if (v == null || Number.isNaN(v as number)) return "";
    return Math.round(v as number);
  }
  if (MONEY_IDS.has(id) || typeof v === "number") {
    if (v == null || Number.isNaN(v as number)) return "";
    return v as number;
  }
  const t = cellText(v as string | number | null | undefined);
  return t === "—" ? "" : t;
}

export function buildCustomerTableColumns(
  actionsColumn: ColumnDef<CustomerListRow>,
): ColumnDef<CustomerListRow>[] {
  return [
    {
      id: FARMER_DETAILS_GROUP_ID,
      header: "Farmer Details",
      columns: [
        {
          id: "farmerName",
          accessorKey: "farmerName",
          header: "Farmer Name",
          cell: ({ getValue }) => {
            const value = cellText(getValue() as string);
            return (
              <span
                className="block whitespace-normal break-words leading-[1.4] font-medium"
                title={value}
              >
                {value}
              </span>
            );
          },
          size: 160,
          minSize: 160,
          maxSize: 160,
          enablePinning: true,
        },
        {
          id: "changedFarmerName",
          accessorKey: "changedFarmerName",
          header: "Changed Name",
          cell: ({ getValue }) => (
            <span className="text-[#6B7280]">{cellText(getValue() as string)}</span>
          ),
          size: 140,
          minSize: 140,
          maxSize: 140,
          enablePinning: true,
        },
        {
          id: "vendorCode",
          accessorKey: "vendorCode",
          header: "Vendor Code",
          cell: ({ getValue }) => (
            <span className="font-mono text-[#2563EB]">{cellText(getValue() as string)}</span>
          ),
          size: 120,
          minSize: 120,
          maxSize: 120,
          enablePinning: true,
        },
        {
          id: "surveyNo",
          accessorKey: "surveyNo",
          header: "Survey No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 120,
          minSize: 120,
          maxSize: 120,
          enablePinning: true,
        },
        {
          id: "newSurveyNo",
          accessorKey: "newSurveyNo",
          header: "New Survey No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 95,
          minSize: 90,
          enablePinning: true,
        },
      ],
    },
    {
      id: "rtcExtent",
      header: "RTC Extent",
      columns: [
        {
          id: "rtcExtentAcre",
          accessorKey: "rtcExtentAcre",
          header: "Acre",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 100,
          minSize: 96,
        },
        {
          id: "rtcExtentGunta",
          accessorKey: "rtcExtentGunta",
          header: "Gunta",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 100,
          minSize: 96,
        },
        {
          id: "rtcAKharab",
          accessorKey: "rtcAKharab",
          header: "A Kharab",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 104,
          minSize: 96,
        },
        {
          id: "rtcBKharab",
          accessorKey: "rtcBKharab",
          header: "B Kharab",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 104,
          minSize: 96,
        },
      ],
    },
    {
      id: "balanceExtent",
      header: "Balance Extent",
      columns: [
        {
          id: "balanceExtentAcre",
          accessorKey: "balanceExtentAcre",
          header: "Acre",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 100,
          minSize: 96,
        },
        {
          id: "balanceExtentGunta",
          accessorKey: "balanceExtentGunta",
          header: "Gunta",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 100,
          minSize: 96,
        },
      ],
    },
    {
      id: "leaseExtent",
      header: "Lease Extent",
      columns: [
        {
          id: "leaseExtentAcre",
          accessorKey: "leaseExtentAcre",
          header: "Acre",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 100,
          minSize: 96,
        },
        {
          id: "leaseExtentGunta",
          accessorKey: "leaseExtentGunta",
          header: "Gunta",
          cell: ({ getValue }) => extentCell(getValue() as number),
          size: 100,
          minSize: 96,
        },
      ],
    },
    columnGroup("totalGuntaGroup", "Total Gunta", {
      id: "totalGunta",
      header: "Total Gunta",
      cell: ({ row }) => computedColumnCell(row.original, "totalGunta"),
      size: 104,
      minSize: 96,
    }, { subHeader: null }),
    columnGroup("totalCentsGroup", "Total Cents", {
      id: "totalCents",
      header: "Total Cents",
      cell: ({ row }) => computedColumnCell(row.original, "totalCents"),
      size: 104,
      minSize: 96,
    }, { subHeader: null }),
    columnGroup("rentPerAcreGroup", "Rent Per Acre", {
      id: "rentPerAcre",
      accessorKey: "rentPerAcre",
      header: "Rent Per Acre",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 104,
      minSize: 96,
    }, { subHeader: null }),
    columnGroup("noOfYearsGroup", "No. of Years", {
      id: "noOfYears",
      accessorKey: "noOfYears",
      header: "No. of Years",
      cell: ({ getValue }) => extentCell(getValue() as number),
      size: 104,
      minSize: 96,
    }, { subHeader: null }),
    columnGroup("rentAmountGroup", "Total Rent", {
      id: "rentAmount",
      header: "Total Rent",
      cell: ({ row }) => computedColumnCell(row.original, "rentAmount"),
      size: 104,
      minSize: 96,
    }, { subHeader: null }),
    {
      id: "aesAdvance",
      header: "AES Advance Per Acre",
      columns: [
        {
          id: "aesAdvanceDate",
          accessorKey: "aesAdvanceDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "aesAdvanceChequeNo",
          accessorKey: "aesAdvanceChequeNo",
          header: "Cheque No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "aesAdvanceChequeAmount",
          accessorKey: "aesAdvanceChequeAmount",
          header: "Cheque Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "aesAdvanceBankName",
          accessorKey: "aesAdvanceBankName",
          header: "Bank Name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 110,
        },
      ],
    },
    columnGroup("balanceRentAmountGroup", "Balance Rent Amount", {
      id: "balanceRentAmount",
      header: "Balance Rent Amount",
      cell: ({ row }) => computedColumnCell(row.original, "balanceRentAmount"),
      size: 120,
      minSize: 104,
    }, { subHeader: null }),
    columnGroup("tdsAmountGroup", "TDS Amount", {
      id: "tdsAmount",
      accessorKey: "tdsAmount",
      header: "TDS Amount",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 104,
      minSize: 96,
    }, { subHeader: null }),
    {
      id: "shortageOnce",
      header: "AES Shortage Amount Through Cheque One",
      columns: [
        {
          id: "shortageChequeAmount",
          accessorKey: "shortageChequeAmount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "shortageDate",
          accessorKey: "shortageDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "shortageChequeNo",
          accessorKey: "shortageChequeNo",
          header: "Cheque No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "shortageBankName",
          accessorKey: "shortageBankName",
          header: "Bank Name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 110,
        },
      ],
    },
    {
      id: "shortageSecond",
      header: "AES Shortage Amount Through Cheque Two",
      columns: [
        {
          id: "shortageAmountSecondTime",
          accessorKey: "shortageAmountSecondTime",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "shortageSecondDate",
          accessorKey: "shortageSecondDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "shortageSecondChequeNo",
          accessorKey: "shortageSecondChequeNo",
          header: "Cheque No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "shortageSecondBankName",
          accessorKey: "shortageSecondBankName",
          header: "Bank Name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 110,
        },
      ],
    },
    {
      id: "shortageThird",
      header: "AES Shortage Amount Through Cheque Three",
      columns: [
        {
          id: "shortageThirdChequeAmount",
          accessorKey: "shortageThirdChequeAmount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "shortageThirdDate",
          accessorKey: "shortageThirdDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "shortageThirdChequeNo",
          accessorKey: "shortageThirdChequeNo",
          header: "Cheque No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "shortageThirdBankName",
          accessorKey: "shortageThirdBankName",
          header: "Bank Name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 110,
        },
      ],
    },
    columnGroup(
      "shortageAmountTotalGroup",
      "Total AES Paid",
      {
        id: "shortageAmountTotal",
        header: "Total AES Paid",
        cell: ({ row }) => computedColumnCell(row.original, "shortageAmountTotal"),
        size: 140,
        minSize: 120,
      },
      { subHeader: null },
    ),
    {
      id: "bankLoanDd",
      header: "Bank Loan DD From Company",
      columns: [
        {
          id: "bankLoanDdDate",
          accessorKey: "bankLoanDdDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "loanAmount",
          accessorKey: "loanAmount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "bankLoanDdNo",
          accessorKey: "bankLoanDdNo",
          header: "DD No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "bankLoanBankName",
          accessorKey: "bankLoanBankName",
          header: "Bank Name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 110,
        },
      ],
    },
    {
      id: "rentalDd",
      header: "Rental DD From Company 1",
      columns: [
        {
          id: "rentalDdDate",
          accessorKey: "rentalDdDate",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "leaseAmount",
          accessorKey: "leaseAmount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "rentalDdChequeNo",
          accessorKey: "rentalDdChequeNo",
          header: "DD No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "rentalDdBankName",
          accessorKey: "rentalDdBankName",
          header: "Bank Name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 110,
        },
      ],
    },
    {
      id: "rentalDdPart1",
      header: "Rental DD From Company 2",
      columns: [
        {
          id: "rentalDdPart1Date",
          accessorKey: "rentalDdPart1Date",
          header: "Date",
          cell: ({ getValue }) => dateCell(getValue() as string),
          size: 95,
        },
        {
          id: "rentalDdPart1Amount",
          accessorKey: "rentalDdPart1Amount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "rentalDdPart1ChequeNo",
          accessorKey: "rentalDdPart1ChequeNo",
          header: "DD No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 90,
        },
        {
          id: "rentalDdPart1BankName",
          accessorKey: "rentalDdPart1BankName",
          header: "Bank Name",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 110,
        },
      ],
    },
    columnGroup("atl", "ATL", {
      id: "atlTotal",
      accessorKey: "atlTotal",
      header: "ATL Govt Fee",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 112,
      minSize: 104,
    }, { subHeader: "ATL Govt Fee" }),
    columnGroup("pao", "POA/GPA", {
      id: "paoTotal",
      accessorKey: "paoTotal",
      header: "GPA/POA GOVT Fee",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 120,
      minSize: 104,
    }, { subHeader: "GPA/POA GOVT Fee" }),
    {
      id: "na",
      header: "NA",
      columns: [
        {
          id: "landConversion",
          accessorKey: "landConversion",
          header: "Land Conversion",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
        {
          id: "otherRecoveries",
          accessorKey: "otherRecoveries",
          header: "Other Recoveries",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 120,
          minSize: 104,
        },
        {
          id: "podiFee",
          accessorKey: "podiFee",
          header: "Podi Fee",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 104,
          minSize: 96,
        },
      ],
    },
    columnGroup("leaseDeed", "Lease Deed", {
      id: "leaseDeedGovtFee",
      header: "K2 Challan",
      cell: ({ row }) => moneyCell(computeLeaseDeedGovtFee(row.original)),
      size: 104,
      minSize: 96,
    }, { subHeader: "K2 Challan" }),
    columnGroup("totalGovtFeeGroup", "Total Govt Fee", {
      id: "totalGovtFee",
      header: "Total Govt Fee",
      cell: ({ row }) => computedColumnCell(row.original, "totalGovtFee"),
      size: 120,
      minSize: 104,
    }, { subHeader: null }),
    {
      id: "debitNote",
      header: "Debit Note",
      columns: [
        {
          id: "debitNoteNo",
          accessorKey: "debitNoteNo",
          header: "DB No",
          cell: ({ getValue }) => textCell(getValue() as string),
          size: 85,
        },
        {
          id: "debitNoteAmount",
          accessorKey: "debitNoteAmount",
          header: "Amount",
          cell: ({ getValue }) => moneyCell(getValue() as number),
          size: 112,
          minSize: 104,
        },
      ],
    },
    columnGroup("remarkGroup", "Remark", {
      id: "remark",
      accessorKey: "notes",
      header: "Remark",
      cell: ({ getValue }) => remarkCell(getValue() as string),
      size: 140,
      minSize: 120,
      maxSize: 200,
    }, { subHeader: null }),
    columnGroup("otherChargesGroup", "Other Charger", {
      id: "otherCharges",
      accessorKey: "otherCharges",
      header: "Other Charger",
      cell: ({ getValue }) => moneyCell(getValue() as number),
      size: 112,
      minSize: 104,
    }, { subHeader: null }),
    columnGroup("cropCompensationGroup", "Crop Compensations", {
      id: "cropCompensation",
      accessorKey: "cropCompensation",
      header: "Crop Compensations",
      cell: ({ getValue }) => integerMoneyCell(getValue() as number),
      size: 120,
      minSize: 104,
    }, { subHeader: null }),
    columnGroup(ACTIONS_GROUP_ID, "Actions", actionsColumn, { subHeader: null }),
  ];
}
