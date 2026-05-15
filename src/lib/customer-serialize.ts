import type { Customer } from "@prisma/client";
import { CUSTOMER_FORM_FIELD_NAMES } from "@/lib/customer-field-layout";

function numToInput(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return String(value);
}

/** String defaults for every customer form field (edit / error replay). */
export function customerToFormValues(customer: Customer): Record<string, string> {
  return {
    farmerName: customer.farmerName ?? "",
    changedFarmerName: customer.changedFarmerName ?? "",
    vendorCode: customer.vendorCode ?? "",
    surveyNo: customer.surveyNo ?? "",
    newSurveyNo: customer.newSurveyNo ?? "",
    rtcExtentAcre: numToInput(customer.rtcExtentAcre),
    rtcExtentGunta: numToInput(customer.rtcExtentGunta),
    rtcAKharab: numToInput(customer.rtcAKharab),
    rtcBKharab: numToInput(customer.rtcBKharab),
    balanceExtentAcre: numToInput(customer.balanceExtentAcre),
    balanceExtentGunta: numToInput(customer.balanceExtentGunta),
    leaseExtentAcre: numToInput(customer.leaseExtentAcre),
    leaseExtentGunta: numToInput(customer.leaseExtentGunta),
    totalGunta: numToInput(customer.totalGunta),
    totalCents: numToInput(customer.totalCents),
    rentPerAcre: numToInput(customer.rentPerAcre),
    balanceRentAmount: numToInput(customer.balanceRentAmount),
    rentAmount: numToInput(customer.rentAmount),
    tdsAmount: numToInput(customer.tdsAmount),
    aesAdvanceChequeAmount: numToInput(customer.aesAdvanceChequeAmount),
    aesAdvanceDate: customer.aesAdvanceDate ?? "",
    aesAdvanceChequeNo: customer.aesAdvanceChequeNo ?? "",
    aesAdvanceBankName: customer.aesAdvanceBankName ?? "",
    shortageChequeAmount: numToInput(customer.shortageChequeAmount),
    shortageDate: customer.shortageDate ?? "",
    shortageChequeNo: customer.shortageChequeNo ?? "",
    shortageBankName: customer.shortageBankName ?? "",
    atlStampDuty: numToInput(customer.atlStampDuty),
    atlRegCharges: numToInput(customer.atlRegCharges),
    atlTotal: numToInput(customer.atlTotal),
    paoStampDuty: numToInput(customer.paoStampDuty),
    paoRegCharges: numToInput(customer.paoRegCharges),
    paoTotal: numToInput(customer.paoTotal),
    landConversion: numToInput(customer.landConversion),
    podiFee: numToInput(customer.podiFee),
    leaseDeedStampDuty: numToInput(customer.leaseDeedStampDuty),
    leaseDeedRegCharges: numToInput(customer.leaseDeedRegCharges),
    debitNoteNo: customer.debitNoteNo ?? "",
    debitNoteAmount: numToInput(customer.debitNoteAmount),
    receivedNeftAmount: numToInput(customer.receivedNeftAmount),
    receivedDate: customer.receivedDate ?? "",
    balanceReceivable: numToInput(customer.balanceReceivable),
    cropCompensation: numToInput(customer.cropCompensation),
    loanAmount: numToInput(customer.loanAmount),
  };
}

export function emptyCustomerFormValues(): Record<string, string> {
  return Object.fromEntries(CUSTOMER_FORM_FIELD_NAMES.map((k) => [k, ""]));
}
