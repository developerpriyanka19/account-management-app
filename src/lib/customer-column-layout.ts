/**
 * Single source of truth for farmer table / form / export column structure.
 * Dashboard, Farmer Entry, and Excel export all derive from CUSTOMER_COLUMN_GROUPS.
 */

export type FieldInputType = "text" | "number" | "date";
export type FieldVariant = "money" | "extent" | "text";

export type CustomerColumnField = {
  id: string;
  label: string;
  inputType: FieldInputType;
  variant?: FieldVariant;
  required?: boolean;
  computed?: boolean;
  /** Form input name when it differs from column id (e.g. remark → notes in DB). */
  formName?: string;
};

export type CustomerColumnGroup = {
  label: string;
  headerTone?: "red";
  fields: CustomerColumnField[];
};

export const CUSTOMER_COLUMN_GROUPS: CustomerColumnGroup[] = [
  {
    label: "Farmer Details",
    fields: [
      { id: "farmerName", label: "Farmer Name", inputType: "text", required: true },
      { id: "changedFarmerName", label: "Changed Name", inputType: "text" },
      { id: "vendorCode", label: "Vendor Code", inputType: "text", required: true },
      { id: "surveyNo", label: "Survey No", inputType: "text", required: true },
      { id: "newSurveyNo", label: "New Survey No", inputType: "text" },
    ],
  },
  {
    label: "RTC Extent",
    fields: [
      { id: "rtcExtentAcre", label: "Acre", inputType: "number", variant: "extent" },
      { id: "rtcExtentGunta", label: "Gunta", inputType: "number", variant: "extent" },
      { id: "rtcAKharab", label: "A Kharab", inputType: "number", variant: "extent" },
      { id: "rtcBKharab", label: "B Kharab", inputType: "number", variant: "extent" },
    ],
  },
  {
    label: "Balance Extent",
    fields: [
      { id: "balanceExtentAcre", label: "Acre", inputType: "number", variant: "extent" },
      { id: "balanceExtentGunta", label: "Gunta", inputType: "number", variant: "extent" },
    ],
  },
  {
    label: "Lease Extent",
    fields: [
      { id: "leaseExtentAcre", label: "Acre", inputType: "number", variant: "extent" },
      { id: "leaseExtentGunta", label: "Gunta", inputType: "number", variant: "extent" },
    ],
  },
  {
    label: "Total Gunta",
    fields: [
      { id: "totalGunta", label: "Total Gunta", inputType: "number", variant: "extent", computed: true },
    ],
  },
  {
    label: "Total Cents",
    fields: [
      { id: "totalCents", label: "Total Cents", inputType: "number", variant: "extent", computed: true },
    ],
  },
  {
    label: "Rent Per Acre",
    fields: [
      { id: "rentPerAcre", label: "Rent Per Acre", inputType: "number", variant: "money" },
    ],
  },
  {
    label: "No. of Years",
    fields: [
      { id: "noOfYears", label: "No. of Years", inputType: "number", variant: "extent" },
    ],
  },
  {
    label: "Total Rent",
    fields: [
      { id: "rentAmount", label: "Total Rent", inputType: "number", variant: "money", computed: true },
    ],
  },
  {
    label: "AES Advance Per Acre",
    fields: [
      { id: "aesAdvanceDate", label: "Date", inputType: "date" },
      { id: "aesAdvanceChequeNo", label: "Cheque No", inputType: "text" },
      { id: "aesAdvanceChequeAmount", label: "Cheque Amount", inputType: "number", variant: "money" },
      { id: "aesAdvanceBankName", label: "Bank Name", inputType: "text" },
    ],
  },
  {
    label: "Balance Rent Amount",
    fields: [
      {
        id: "balanceRentAmount",
        label: "Balance Rent Amount",
        inputType: "number",
        variant: "money",
        computed: true,
      },
    ],
  },
  {
    label: "TDS Amount",
    fields: [
      { id: "tdsAmount", label: "TDS Amount", inputType: "number", variant: "money" },
    ],
  },
  {
    label: "AES Shortage Amount Through Cheque One",
    fields: [
      { id: "shortageChequeAmount", label: "Amount", inputType: "number", variant: "money" },
      { id: "shortageDate", label: "Date", inputType: "date" },
      { id: "shortageChequeNo", label: "Cheque No", inputType: "text" },
      { id: "shortageBankName", label: "Bank Name", inputType: "text" },
    ],
  },
  {
    label: "AES Shortage Amount Through Cheque Two",
    fields: [
      { id: "shortageAmountSecondTime", label: "Amount", inputType: "number", variant: "money" },
      { id: "shortageSecondDate", label: "Date", inputType: "date" },
      { id: "shortageSecondChequeNo", label: "Cheque No", inputType: "text" },
      { id: "shortageSecondBankName", label: "Bank Name", inputType: "text" },
    ],
  },
  {
    label: "AES Shortage Amount Through Cheque Three",
    fields: [
      { id: "shortageThirdChequeAmount", label: "Amount", inputType: "number", variant: "money" },
      { id: "shortageThirdDate", label: "Date", inputType: "date" },
      { id: "shortageThirdChequeNo", label: "Cheque No", inputType: "text" },
      { id: "shortageThirdBankName", label: "Bank Name", inputType: "text" },
    ],
  },
  {
    label: "Total AES Paid",
    fields: [
      {
        id: "shortageAmountTotal",
        label: "Total AES Paid",
        inputType: "number",
        variant: "money",
        computed: true,
      },
    ],
  },
  {
    label: "Bank Loan DD From Company",
    fields: [
      { id: "bankLoanDdDate", label: "Date", inputType: "date" },
      { id: "loanAmount", label: "Amount", inputType: "number", variant: "money" },
      { id: "bankLoanDdNo", label: "DD No", inputType: "text" },
      { id: "bankLoanBankName", label: "Bank Name", inputType: "text" },
    ],
  },
  {
    label: "Rental DD From Company 1",
    fields: [
      { id: "rentalDdDate", label: "Date", inputType: "date" },
      { id: "leaseAmount", label: "Amount", inputType: "number", variant: "money" },
      { id: "rentalDdChequeNo", label: "DD No", inputType: "text" },
      { id: "rentalDdBankName", label: "Bank Name", inputType: "text" },
    ],
  },
  {
    label: "Rental DD From Company 2",
    fields: [
      { id: "rentalDdPart1Date", label: "Date", inputType: "date" },
      { id: "rentalDdPart1Amount", label: "Amount", inputType: "number", variant: "money" },
      { id: "rentalDdPart1ChequeNo", label: "DD No", inputType: "text" },
      { id: "rentalDdPart1BankName", label: "Bank Name", inputType: "text" },
    ],
  },
  {
    label: "ATL",
    fields: [
      { id: "atlTotal", label: "ATL Govt Fee", inputType: "number", variant: "money" },
    ],
  },
  {
    label: "POA/GPA",
    fields: [
      { id: "paoTotal", label: "GPA/POA GOVT Fee", inputType: "number", variant: "money" },
    ],
  },
  {
    label: "NA",
    fields: [
      { id: "landConversion", label: "Land Conversion", inputType: "number", variant: "money" },
      { id: "otherRecoveries", label: "Other Recoveries", inputType: "number", variant: "money" },
      { id: "podiFee", label: "Podi Fee", inputType: "number", variant: "money" },
    ],
  },
  {
    label: "Lease Deed",
    fields: [
      { id: "leaseDeedGovtFee", label: "K2 Challan", inputType: "number", variant: "money" },
    ],
  },
  {
    label: "Total Govt Fee",
    fields: [
      { id: "totalGovtFee", label: "Total Govt Fee", inputType: "number", variant: "money", computed: true },
    ],
  },
  {
    label: "Debit Note",
    fields: [
      { id: "debitNoteNo", label: "DB No", inputType: "text" },
      { id: "debitNoteAmount", label: "Amount", inputType: "number", variant: "money" },
    ],
  },
  {
    label: "Remark",
    fields: [
      { id: "remark", label: "Remark", inputType: "text", formName: "remark" },
    ],
  },
  {
    label: "Other Charger",
    fields: [
      { id: "otherCharges", label: "Other Charger", inputType: "number", variant: "money" },
    ],
  },
  {
    label: "Crop Compensations",
    fields: [
      { id: "cropCompensation", label: "Crop Compensations", inputType: "number", variant: "money" },
    ],
  },
];

export const LEAF_COLUMN_IDS = CUSTOMER_COLUMN_GROUPS.flatMap((g) =>
  g.fields.map((f) => f.id),
) as readonly string[];

export type LeafColumnId = (typeof LEAF_COLUMN_IDS)[number] | ExportOnlyLeafId;

type ExportOnlyLeafId = "state" | "district" | "taluk" | "hobbli" | "village";

export type ExportGroup = {
  label: string;
  leafLabels: string[];
  leafIds: LeafColumnId[];
  headerTone?: "red";
};

export const EXPORT_GROUPS: ExportGroup[] = [
  {
    label: "Location",
    leafLabels: ["State", "District", "Taluk", "Hobli", "Village"],
    leafIds: ["state", "district", "taluk", "hobbli", "village"],
  },
  ...CUSTOMER_COLUMN_GROUPS.map((group) => ({
    label: group.label,
    headerTone: group.headerTone,
    leafLabels: group.fields.map((f) => f.label),
    leafIds: group.fields.map((f) => f.id) as LeafColumnId[],
  })),
];

export type CustomerLayoutRow =
  | { row: "parent"; label: string; headerTone?: "red" }
  | {
      row: "field";
      label: string;
      name: string;
      inputType: FieldInputType;
      variant?: FieldVariant;
      required?: boolean;
      computed?: boolean;
    };

export const CUSTOMER_FIELD_LAYOUT: CustomerLayoutRow[] = CUSTOMER_COLUMN_GROUPS.flatMap(
  (group) => {
    const rows: CustomerLayoutRow[] = [
      { row: "parent", label: group.label, headerTone: group.headerTone },
    ];
    for (const field of group.fields) {
      rows.push({
        row: "field",
        label: field.label,
        name: field.formName ?? field.id,
        inputType: field.inputType,
        variant: field.variant,
        required: field.required,
        computed: field.computed,
      });
    }
    return rows;
  },
);

export const COMPUTED_FARMER_FIELD_NAMES = CUSTOMER_COLUMN_GROUPS.flatMap((g) =>
  g.fields.filter((f) => f.computed).map((f) => f.formName ?? f.id),
) as readonly string[];

export const CUSTOMER_FORM_FIELD_NAMES = CUSTOMER_FIELD_LAYOUT.filter(
  (r): r is Extract<CustomerLayoutRow, { row: "field" }> => r.row === "field",
).map((r) => r.name);

/** DB-only fields kept on edit but not shown in the dashboard-aligned form. */
export const PRESERVED_OFF_LAYOUT_DB_FIELDS = [
  "shortageNote",
  "receivedDate",
  "balanceRentChequeNo",
  "receivedNeftAmount",
] as const;
