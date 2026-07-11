import { CUSTOMER_FIELD_LAYOUT } from "@/lib/customer-field-layout";
import {
  computeFarmerDerivedFields,
  roundToThreeDecimals,
  roundToTwoDecimals,
} from "@/lib/customer-computed-totals";
import { isValidDisplayDate, isValidStorageDate, toStorageDate } from "@/lib/date-format";

export type CustomerFormFieldErrors = Record<string, string>;

export type CustomerFormValues = Record<string, string>;

export type CustomerFormState = {
  fieldErrors?: CustomerFormFieldErrors;
  values?: CustomerFormValues;
};

const REQUIRED = "This field is required.";
const INVALID_NUMBER = "Enter a valid number.";
const INVALID_DATE = "Use a valid date (DD/MM/YYYY).";

const LOCATION_REQUIRED_FIELDS = ["state", "district", "taluk", "hobbli", "village"] as const;

const LAYOUT_FIELDS = CUSTOMER_FIELD_LAYOUT.filter(
  (r): r is Extract<(typeof CUSTOMER_FIELD_LAYOUT)[number], { row: "field" }> =>
    r.row === "field",
);

const ALL_FORM_KEYS = [
  ...LOCATION_REQUIRED_FIELDS,
  ...LAYOUT_FIELDS.map((r) => r.name),
];

const OPTIONAL_FLOAT_FIELDS = LAYOUT_FIELDS.filter(
  (r) => r.inputType === "number" && r.computed !== true,
).map((r) => r.name) as readonly string[];

const OPTIONAL_DATE_FIELDS = LAYOUT_FIELDS.filter((r) => r.inputType === "date").map(
  (r) => r.name,
) as readonly string[];

const OPTIONAL_TEXT_FIELDS = LAYOUT_FIELDS.filter((r) => r.inputType === "text").map(
  (r) => r.name,
) as readonly string[];

const REQUIRED_TEXT_FIELDS = LAYOUT_FIELDS.filter((r) => r.required).map((r) => r.name);

function readTrimmed(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function readOptionalFloat(
  raw: string,
  field: string,
  fieldErrors: CustomerFormFieldErrors,
): number | null {
  const normalized = raw.trim().replace(/,/g, "");
  if (normalized === "") return null;
  const n = Number(normalized);
  if (!Number.isFinite(n)) {
    fieldErrors[field] = INVALID_NUMBER;
    return null;
  }
  return n;
}

function readOptionalDate(
  raw: string,
  field: string,
  fieldErrors: CustomerFormFieldErrors,
): string | null {
  const t = raw.trim();
  if (t === "") return null;
  if (isValidStorageDate(t)) return t;
  if (isValidDisplayDate(t)) {
    return toStorageDate(t);
  }
  fieldErrors[field] = INVALID_DATE;
  return null;
}

export type ValidatedCustomerPayload = {
  farmerName: string;
  changedFarmerName: string | null;
  vendorCode: string;
  surveyNo: string;
  newSurveyNo: string | null;
  state: string;
  district: string;
  taluk: string;
  hobbli: string;
  village: string;
  rtcExtentAcre: number | null;
  rtcExtentGunta: number | null;
  rtcAKharab: number | null;
  rtcBKharab: number | null;
  balanceExtentAcre: number | null;
  balanceExtentGunta: number | null;
  leaseExtentAcre: number | null;
  leaseExtentGunta: number | null;
  totalGunta: number | null;
  totalCents: number | null;
  rentPerAcre: number | null;
  noOfYears: number | null;
  rentAmount: number | null;
  aesAdvanceDate: string | null;
  aesAdvanceChequeNo: string | null;
  aesAdvanceChequeAmount: number | null;
  aesAdvanceBankName: string | null;
  balanceRentAmount: number | null;
  tdsAmount: number | null;
  bankLoanDdDate: string | null;
  loanAmount: number | null;
  bankLoanDdNo: string | null;
  bankLoanBankName: string | null;
  rentalDdDate: string | null;
  leaseAmount: number | null;
  rentalDdChequeNo: string | null;
  rentalDdBankName: string | null;
  rentalDdPart1Date: string | null;
  rentalDdPart1Amount: number | null;
  rentalDdPart1ChequeNo: string | null;
  rentalDdPart1BankName: string | null;
  shortageChequeAmount: number | null;
  shortageDate: string | null;
  shortageChequeNo: string | null;
  shortageBankName: string | null;
  shortageAmountSecondTime: number | null;
  shortageSecondDate: string | null;
  shortageSecondChequeNo: string | null;
  shortageSecondBankName: string | null;
  shortageThirdChequeAmount: number | null;
  shortageThirdDate: string | null;
  shortageThirdChequeNo: string | null;
  shortageThirdBankName: string | null;
  shortageAmountTotal: number | null;
  atlTotal: number | null;
  paoTotal: number | null;
  landConversion: number | null;
  otherRecoveries: number | null;
  podiFee: number | null;
  totalGovtFee: number | null;
  leaseDeedStampDuty: number | null;
  leaseDeedRegCharges: number | null;
  debitNoteNo: string | null;
  debitNoteAmount: number | null;
  otherCharges: number | null;
  cropCompensation: number | null;
  notes: string | null;
};

function collectStringValues(formData: FormData): CustomerFormValues {
  const values: CustomerFormValues = {};
  for (const key of ALL_FORM_KEYS) {
    values[key] = String(formData.get(key) ?? "");
  }
  return values;
}

export function validateCustomerForm(
  formData: FormData,
): { ok: true; data: ValidatedCustomerPayload } | { ok: false; state: CustomerFormState } {
  const values = collectStringValues(formData);
  const fieldErrors: CustomerFormFieldErrors = {};

  for (const name of LOCATION_REQUIRED_FIELDS) {
    if (!readTrimmed(formData, name)) {
      fieldErrors[name] = REQUIRED;
    }
  }

  for (const name of REQUIRED_TEXT_FIELDS) {
    if (!readTrimmed(formData, name)) {
      fieldErrors[name] = REQUIRED;
    }
  }

  const farmerName = readTrimmed(formData, "farmerName");
  const vendorCode = readTrimmed(formData, "vendorCode");
  const surveyNo = readTrimmed(formData, "surveyNo");
  const state = readTrimmed(formData, "state");
  const district = readTrimmed(formData, "district");
  const taluk = readTrimmed(formData, "taluk");
  const hobbli = readTrimmed(formData, "hobbli");
  const village = readTrimmed(formData, "village");

  const optionalTexts: Record<string, string | null> = {};
  for (const name of OPTIONAL_TEXT_FIELDS) {
    if (REQUIRED_TEXT_FIELDS.includes(name)) continue;
    const t = readTrimmed(formData, name);
    optionalTexts[name] = t || null;
  }

  const floats: Record<string, number | null> = {};
  for (const f of OPTIONAL_FLOAT_FIELDS) {
    floats[f] = readOptionalFloat(values[f] ?? "", f, fieldErrors);
  }

  const dates: Record<string, string | null> = {};
  for (const d of OPTIONAL_DATE_FIELDS) {
    dates[d] = readOptionalDate(values[d] ?? "", d, fieldErrors);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, state: { fieldErrors, values } };
  }

  const derived = computeFarmerDerivedFields({
    leaseExtentAcre: floats.leaseExtentAcre,
    leaseExtentGunta: floats.leaseExtentGunta,
    rentPerAcre: floats.rentPerAcre,
    aesAdvanceChequeAmount: floats.aesAdvanceChequeAmount,
    shortageChequeAmount: floats.shortageChequeAmount,
    shortageAmountSecondTime: floats.shortageAmountSecondTime,
    shortageThirdChequeAmount: floats.shortageThirdChequeAmount,
    atlTotal: floats.atlTotal,
    paoTotal: floats.paoTotal,
    landConversion: floats.landConversion,
    otherRecoveries: floats.otherRecoveries,
    podiFee: floats.podiFee,
    leaseDeedStampDuty: floats.leaseDeedGovtFee,
    leaseDeedRegCharges: 0,
  });

  const k2Challan = floats.leaseDeedGovtFee ?? null;

  return {
    ok: true,
    data: {
      farmerName,
      changedFarmerName: optionalTexts.changedFarmerName ?? null,
      vendorCode,
      surveyNo,
      newSurveyNo: optionalTexts.newSurveyNo ?? null,
      state,
      district,
      taluk,
      hobbli,
      village,
      rtcExtentAcre: floats.rtcExtentAcre ?? null,
      rtcExtentGunta: floats.rtcExtentGunta ?? null,
      rtcAKharab: floats.rtcAKharab ?? null,
      rtcBKharab: floats.rtcBKharab ?? null,
      balanceExtentAcre: floats.balanceExtentAcre ?? null,
      balanceExtentGunta: floats.balanceExtentGunta ?? null,
      leaseExtentAcre: floats.leaseExtentAcre ?? null,
      leaseExtentGunta: floats.leaseExtentGunta ?? null,
      totalGunta: roundToTwoDecimals(derived.totalGunta),
      totalCents: roundToThreeDecimals(derived.totalCents),
      rentPerAcre: floats.rentPerAcre ?? null,
      noOfYears: floats.noOfYears ?? null,
      rentAmount: roundToTwoDecimals(derived.rentAmount),
      aesAdvanceDate: dates.aesAdvanceDate ?? null,
      aesAdvanceChequeNo: optionalTexts.aesAdvanceChequeNo ?? null,
      aesAdvanceChequeAmount: floats.aesAdvanceChequeAmount ?? null,
      aesAdvanceBankName: optionalTexts.aesAdvanceBankName ?? null,
      balanceRentAmount: roundToTwoDecimals(derived.balanceRentAmount),
      tdsAmount: floats.tdsAmount ?? null,
      bankLoanDdDate: dates.bankLoanDdDate ?? null,
      loanAmount: floats.loanAmount ?? null,
      bankLoanDdNo: optionalTexts.bankLoanDdNo ?? null,
      bankLoanBankName: optionalTexts.bankLoanBankName ?? null,
      rentalDdDate: dates.rentalDdDate ?? null,
      leaseAmount: floats.leaseAmount ?? null,
      rentalDdChequeNo: optionalTexts.rentalDdChequeNo ?? null,
      rentalDdBankName: optionalTexts.rentalDdBankName ?? null,
      rentalDdPart1Date: dates.rentalDdPart1Date ?? null,
      rentalDdPart1Amount: floats.rentalDdPart1Amount ?? null,
      rentalDdPart1ChequeNo: optionalTexts.rentalDdPart1ChequeNo ?? null,
      rentalDdPart1BankName: optionalTexts.rentalDdPart1BankName ?? null,
      shortageChequeAmount: floats.shortageChequeAmount ?? null,
      shortageDate: dates.shortageDate ?? null,
      shortageChequeNo: optionalTexts.shortageChequeNo ?? null,
      shortageBankName: optionalTexts.shortageBankName ?? null,
      shortageAmountSecondTime: floats.shortageAmountSecondTime ?? null,
      shortageSecondDate: dates.shortageSecondDate ?? null,
      shortageSecondChequeNo: optionalTexts.shortageSecondChequeNo ?? null,
      shortageSecondBankName: optionalTexts.shortageSecondBankName ?? null,
      shortageThirdChequeAmount: floats.shortageThirdChequeAmount ?? null,
      shortageThirdDate: dates.shortageThirdDate ?? null,
      shortageThirdChequeNo: optionalTexts.shortageThirdChequeNo ?? null,
      shortageThirdBankName: optionalTexts.shortageThirdBankName ?? null,
      shortageAmountTotal: roundToTwoDecimals(derived.shortageAmountTotal),
      atlTotal: floats.atlTotal ?? null,
      paoTotal: floats.paoTotal ?? null,
      landConversion: floats.landConversion ?? null,
      otherRecoveries: floats.otherRecoveries ?? null,
      podiFee: floats.podiFee ?? null,
      totalGovtFee: roundToTwoDecimals(derived.totalGovtFee),
      leaseDeedStampDuty: k2Challan,
      leaseDeedRegCharges: null,
      debitNoteNo: optionalTexts.debitNoteNo ?? null,
      debitNoteAmount: floats.debitNoteAmount ?? null,
      otherCharges: floats.otherCharges ?? null,
      cropCompensation:
        floats.cropCompensation != null ? Math.round(floats.cropCompensation) : null,
      notes: optionalTexts.remark ?? null,
    },
  };
}
