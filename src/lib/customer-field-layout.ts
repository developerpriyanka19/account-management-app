/** Excel column order — parent rows are section labels; field rows follow immediately below. */

export type FieldInputType = "text" | "number" | "date";
export type FieldVariant = "money" | "extent" | "text";

export type CustomerLayoutRow =
  | { row: "parent"; label: string }
  | {
      row: "field";
      label: string;
      name: string;
      inputType: FieldInputType;
      variant?: FieldVariant;
      required?: boolean;
    };

export const CUSTOMER_FIELD_LAYOUT: CustomerLayoutRow[] = [
  { row: "field", label: "Farmers Name", name: "farmerName", inputType: "text", required: true },
  {
    row: "field",
    label: "Change of Farmers Name",
    name: "changedFarmerName",
    inputType: "text",
  },
  { row: "field", label: "Vendor Code", name: "vendorCode", inputType: "text", required: true },
  { row: "field", label: "Survey No", name: "surveyNo", inputType: "text", required: true },
  { row: "field", label: "New Survey No", name: "newSurveyNo", inputType: "text" },
  { row: "parent", label: "RTC Extent" },
  { row: "field", label: "Acre", name: "rtcExtentAcre", inputType: "number", variant: "extent" },
  { row: "field", label: "Gunta", name: "rtcExtentGunta", inputType: "number", variant: "extent" },
  { row: "field", label: "A Kharab", name: "rtcAKharab", inputType: "number", variant: "extent" },
  { row: "field", label: "B Kharab", name: "rtcBKharab", inputType: "number", variant: "extent" },
  { row: "parent", label: "Balance Extent" },
  {
    row: "field",
    label: "Acre",
    name: "balanceExtentAcre",
    inputType: "number",
    variant: "extent",
  },
  {
    row: "field",
    label: "Gunta",
    name: "balanceExtentGunta",
    inputType: "number",
    variant: "extent",
  },
  { row: "parent", label: "Lease Extent" },
  { row: "field", label: "Acre", name: "leaseExtentAcre", inputType: "number", variant: "extent" },
  { row: "field", label: "Gunta", name: "leaseExtentGunta", inputType: "number", variant: "extent" },
  { row: "field", label: "Total Gunta", name: "totalGunta", inputType: "number", variant: "extent" },
  { row: "field", label: "Total Cents", name: "totalCents", inputType: "number", variant: "extent" },
  { row: "field", label: "Rent Per Acre", name: "rentPerAcre", inputType: "number", variant: "money" },
  { row: "parent", label: "AES Advance per Acre" },
  {
    row: "field",
    label: "Cheque Amount",
    name: "aesAdvanceChequeAmount",
    inputType: "number",
    variant: "money",
  },
  { row: "field", label: "Date", name: "aesAdvanceDate", inputType: "date" },
  { row: "field", label: "Cheque No", name: "aesAdvanceChequeNo", inputType: "text" },
  { row: "field", label: "Bank Name", name: "aesAdvanceBankName", inputType: "text" },
  {
    row: "field",
    label: "Balance Rent Amount",
    name: "balanceRentAmount",
    inputType: "number",
    variant: "money",
  },
  { row: "parent", label: "Lease Amount Issued by Company through DD" },
  { row: "field", label: "Loan", name: "loanAmount", inputType: "number", variant: "money" },
  { row: "field", label: "Rent", name: "rentAmount", inputType: "number", variant: "money" },
  { row: "field", label: "TDS", name: "tdsAmount", inputType: "number", variant: "money" },
  { row: "parent", label: "Shortage Amount Paid from Cheque by AES" },
  {
    row: "field",
    label: "Cheque Amount",
    name: "shortageChequeAmount",
    inputType: "number",
    variant: "money",
  },
  { row: "field", label: "Date", name: "shortageDate", inputType: "date" },
  { row: "field", label: "Cheque No", name: "shortageChequeNo", inputType: "text" },
  { row: "field", label: "Bank Name", name: "shortageBankName", inputType: "text" },
  { row: "parent", label: "ATL" },
  { row: "field", label: "Stamp Duty", name: "atlStampDuty", inputType: "number", variant: "money" },
  { row: "field", label: "Reg Charges", name: "atlRegCharges", inputType: "number", variant: "money" },
  { row: "field", label: "Total", name: "atlTotal", inputType: "number", variant: "money" },
  { row: "parent", label: "PAO/GPA" },
  { row: "field", label: "Stamp Duty", name: "paoStampDuty", inputType: "number", variant: "money" },
  { row: "field", label: "Reg Charges", name: "paoRegCharges", inputType: "number", variant: "money" },
  { row: "field", label: "Total", name: "paoTotal", inputType: "number", variant: "money" },
  { row: "parent", label: "NA" },
  {
    row: "field",
    label: "Land Conversion",
    name: "landConversion",
    inputType: "number",
    variant: "money",
  },
  { row: "field", label: "Podi Fee", name: "podiFee", inputType: "number", variant: "money" },
  { row: "parent", label: "Lease Deed" },
  {
    row: "field",
    label: "Stamp Duty",
    name: "leaseDeedStampDuty",
    inputType: "number",
    variant: "money",
  },
  {
    row: "field",
    label: "Reg Charges",
    name: "leaseDeedRegCharges",
    inputType: "number",
    variant: "money",
  },
  { row: "parent", label: "Debit Note Details" },
  { row: "field", label: "DB No", name: "debitNoteNo", inputType: "text" },
  { row: "field", label: "Amount", name: "debitNoteAmount", inputType: "number", variant: "money" },
  { row: "parent", label: "Received from Company" },
  {
    row: "field",
    label: "NEFT Amount",
    name: "receivedNeftAmount",
    inputType: "number",
    variant: "money",
  },
  { row: "field", label: "Date", name: "receivedDate", inputType: "date" },
  {
    row: "field",
    label: "Balance Receivable",
    name: "balanceReceivable",
    inputType: "number",
    variant: "money",
  },
  {
    row: "field",
    label: "Crop Compensation",
    name: "cropCompensation",
    inputType: "number",
    variant: "money",
  },
];

export const CUSTOMER_FORM_FIELD_NAMES = CUSTOMER_FIELD_LAYOUT.filter(
  (r): r is Extract<CustomerLayoutRow, { row: "field" }> => r.row === "field",
).map((r) => r.name);
