export type CustomerFormFieldErrors = Record<string, string>;

export type CustomerFormValues = Record<string, string>;

export type CustomerFormState = {
  fieldErrors?: CustomerFormFieldErrors;
  values?: CustomerFormValues;
};

const REQUIRED = "This field is required.";
const INVALID_NUMBER = "Enter a valid number.";
const INVALID_DATE = "Use a valid date (YYYY-MM-DD).";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const OPTIONAL_FLOAT_FIELDS = [
  "rtcExtentAcre",
  "rtcExtentGunta",
  "rtcAKharab",
  "rtcBKharab",
  "balanceExtentAcre",
  "balanceExtentGunta",
  "leaseExtentAcre",
  "leaseExtentGunta",
  "leaseAmount",
  "leaseDeedStampDuty",
  "leaseDeedRegCharges",
  "totalGunta",
  "totalCents",
  "rentPerAcre",
  "balanceRentAmount",
  "rentAmount",
  "tdsAmount",
  "aesAdvanceChequeAmount",
  "shortageChequeAmount",
  "atlStampDuty",
  "atlRegCharges",
  "atlTotal",
  "paoStampDuty",
  "paoRegCharges",
  "paoTotal",
  "landConversion",
  "podiFee",
  "cropCompensation",
  "debitNoteAmount",
  "receivedNeftAmount",
  "balanceReceivable",
  "loanAmount",
] as const;

const OPTIONAL_DATE_FIELDS = [
  "aesAdvanceDate",
  "shortageDate",
  "receivedDate",
] as const;

const ALL_FORM_KEYS = [
  "farmerName",
  "changedFarmerName",
  "vendorCode",
  "surveyNo",
  "newSurveyNo",
  ...OPTIONAL_FLOAT_FIELDS,
  ...OPTIONAL_DATE_FIELDS,
  "aesAdvanceChequeNo",
  "aesAdvanceBankName",
  "shortageChequeNo",
  "shortageBankName",
  "debitNoteNo",
  "notes",
] as const;

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
  if (!DATE_RE.test(t)) {
    fieldErrors[field] = INVALID_DATE;
    return null;
  }
  return t;
}

export type ValidatedCustomerPayload = {
  farmerName: string;
  changedFarmerName: string | null;
  vendorCode: string;
  surveyNo: string;
  newSurveyNo: string | null;
  rtcExtentAcre: number | null;
  rtcExtentGunta: number | null;
  rtcAKharab: number | null;
  rtcBKharab: number | null;
  balanceExtentAcre: number | null;
  balanceExtentGunta: number | null;
  leaseExtentAcre: number | null;
  leaseExtentGunta: number | null;
  leaseAmount: number | null;
  leaseDeedStampDuty: number | null;
  leaseDeedRegCharges: number | null;
  totalGunta: number | null;
  totalCents: number | null;
  rentPerAcre: number | null;
  balanceRentAmount: number | null;
  rentAmount: number | null;
  tdsAmount: number | null;
  aesAdvanceChequeAmount: number | null;
  aesAdvanceDate: string | null;
  aesAdvanceChequeNo: string | null;
  aesAdvanceBankName: string | null;
  shortageChequeAmount: number | null;
  shortageDate: string | null;
  shortageChequeNo: string | null;
  shortageBankName: string | null;
  atlStampDuty: number | null;
  atlRegCharges: number | null;
  atlTotal: number | null;
  paoStampDuty: number | null;
  paoRegCharges: number | null;
  paoTotal: number | null;
  landConversion: number | null;
  podiFee: number | null;
  cropCompensation: number | null;
  debitNoteNo: string | null;
  debitNoteAmount: number | null;
  receivedNeftAmount: number | null;
  receivedDate: string | null;
  balanceReceivable: number | null;
  loanAmount: number | null;
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

  const farmerName = readTrimmed(formData, "farmerName");
  const vendorCode = readTrimmed(formData, "vendorCode");
  const surveyNo = readTrimmed(formData, "surveyNo");

  if (!farmerName) fieldErrors.farmerName = REQUIRED;
  if (!vendorCode) fieldErrors.vendorCode = REQUIRED;
  if (!surveyNo) fieldErrors.surveyNo = REQUIRED;

  const changedFarmerName = readTrimmed(formData, "changedFarmerName");
  const newSurveyNo = readTrimmed(formData, "newSurveyNo");
  const aesAdvanceChequeNo = readTrimmed(formData, "aesAdvanceChequeNo");
  const aesAdvanceBankName = readTrimmed(formData, "aesAdvanceBankName");
  const shortageChequeNo = readTrimmed(formData, "shortageChequeNo");
  const shortageBankName = readTrimmed(formData, "shortageBankName");
  const debitNoteNo = readTrimmed(formData, "debitNoteNo");
  const notesRaw = readTrimmed(formData, "notes");

  const floats: Record<(typeof OPTIONAL_FLOAT_FIELDS)[number], number | null> =
    {} as Record<(typeof OPTIONAL_FLOAT_FIELDS)[number], number | null>;
  for (const f of OPTIONAL_FLOAT_FIELDS) {
    floats[f] = readOptionalFloat(values[f] ?? "", f, fieldErrors);
  }

  const dates: Record<(typeof OPTIONAL_DATE_FIELDS)[number], string | null> =
    {} as Record<(typeof OPTIONAL_DATE_FIELDS)[number], string | null>;
  for (const d of OPTIONAL_DATE_FIELDS) {
    dates[d] = readOptionalDate(values[d] ?? "", d, fieldErrors);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, state: { fieldErrors, values } };
  }

  return {
    ok: true,
    data: {
      farmerName,
      changedFarmerName: changedFarmerName || null,
      vendorCode,
      surveyNo,
      newSurveyNo: newSurveyNo || null,
      rtcExtentAcre: floats.rtcExtentAcre,
      rtcExtentGunta: floats.rtcExtentGunta,
      rtcAKharab: floats.rtcAKharab,
      rtcBKharab: floats.rtcBKharab,
      balanceExtentAcre: floats.balanceExtentAcre,
      balanceExtentGunta: floats.balanceExtentGunta,
      leaseExtentAcre: floats.leaseExtentAcre,
      leaseExtentGunta: floats.leaseExtentGunta,
      leaseAmount: floats.leaseAmount,
      leaseDeedStampDuty: floats.leaseDeedStampDuty,
      leaseDeedRegCharges: floats.leaseDeedRegCharges,
      totalGunta: floats.totalGunta,
      totalCents: floats.totalCents,
      rentPerAcre: floats.rentPerAcre,
      balanceRentAmount: floats.balanceRentAmount,
      rentAmount: floats.rentAmount,
      tdsAmount: floats.tdsAmount,
      aesAdvanceChequeAmount: floats.aesAdvanceChequeAmount,
      aesAdvanceDate: dates.aesAdvanceDate,
      aesAdvanceChequeNo: aesAdvanceChequeNo || null,
      aesAdvanceBankName: aesAdvanceBankName || null,
      shortageChequeAmount: floats.shortageChequeAmount,
      shortageDate: dates.shortageDate,
      shortageChequeNo: shortageChequeNo || null,
      shortageBankName: shortageBankName || null,
      atlStampDuty: floats.atlStampDuty,
      atlRegCharges: floats.atlRegCharges,
      atlTotal: floats.atlTotal,
      paoStampDuty: floats.paoStampDuty,
      paoRegCharges: floats.paoRegCharges,
      paoTotal: floats.paoTotal,
      landConversion: floats.landConversion,
      podiFee: floats.podiFee,
      cropCompensation: floats.cropCompensation,
      debitNoteNo: debitNoteNo || null,
      debitNoteAmount: floats.debitNoteAmount,
      receivedNeftAmount: floats.receivedNeftAmount,
      receivedDate: dates.receivedDate,
      balanceReceivable: floats.balanceReceivable,
      loanAmount: floats.loanAmount,
      notes: notesRaw.length > 0 ? notesRaw : null,
    },
  };
}
