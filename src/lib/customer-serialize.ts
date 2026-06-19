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
    rentAmount: numToInput(customer.rentAmount),
    aesAdvanceDate: customer.aesAdvanceDate ?? "",
    aesAdvanceChequeNo: customer.aesAdvanceChequeNo ?? "",
    aesAdvanceChequeAmount: numToInput(customer.aesAdvanceChequeAmount),
    aesAdvanceBankName: customer.aesAdvanceBankName ?? "",
    balanceRentAmount: numToInput(customer.balanceRentAmount),
    tdsAmount: numToInput(customer.tdsAmount),
    bankLoanDdDate: customer.bankLoanDdDate ?? "",
    loanAmount: numToInput(customer.loanAmount),
    bankLoanDdNo: customer.bankLoanDdNo ?? "",
    bankLoanBankName: customer.bankLoanBankName ?? "",
    rentalDdDate: customer.rentalDdDate ?? "",
    leaseAmount: numToInput(customer.leaseAmount),
    rentalDdChequeNo: customer.rentalDdChequeNo ?? "",
    rentalDdBankName: customer.rentalDdBankName ?? "",
    rentalDdPart1Date: customer.rentalDdPart1Date ?? "",
    rentalDdPart1Amount: numToInput(customer.rentalDdPart1Amount),
    rentalDdPart1ChequeNo: customer.rentalDdPart1ChequeNo ?? "",
    rentalDdPart1BankName: customer.rentalDdPart1BankName ?? "",
    receivedDate: customer.receivedDate ?? "",
    balanceRentChequeNo: customer.balanceRentChequeNo ?? "",
    receivedNeftAmount: numToInput(customer.receivedNeftAmount),
    shortageChequeAmount: numToInput(customer.shortageChequeAmount),
    shortageDate: customer.shortageDate ?? "",
    shortageChequeNo: customer.shortageChequeNo ?? "",
    shortageBankName: customer.shortageBankName ?? "",
    shortageNote: customer.shortageNote ?? "",
    shortageAmountSecondTime: numToInput(customer.shortageAmountSecondTime),
    shortageSecondDate: customer.shortageSecondDate ?? "",
    shortageSecondChequeNo: customer.shortageSecondChequeNo ?? "",
    shortageSecondBankName: customer.shortageSecondBankName ?? "",
    shortageThirdChequeAmount: numToInput(customer.shortageThirdChequeAmount),
    shortageThirdDate: customer.shortageThirdDate ?? "",
    shortageThirdChequeNo: customer.shortageThirdChequeNo ?? "",
    shortageThirdBankName: customer.shortageThirdBankName ?? "",
    shortageAmountTotal: numToInput(customer.shortageAmountTotal),
    atlTotal: numToInput(customer.atlTotal),
    paoTotal: numToInput(customer.paoTotal),
    landConversion: numToInput(customer.landConversion),
    otherRecoveries: numToInput(customer.otherRecoveries),
    podiFee: numToInput(customer.podiFee),
    leaseDeedStampDuty: numToInput(customer.leaseDeedStampDuty),
    leaseDeedRegCharges: numToInput(customer.leaseDeedRegCharges),
    debitNoteNo: customer.debitNoteNo ?? "",
    debitNoteAmount: numToInput(customer.debitNoteAmount),
    remark: customer.notes ?? "",
    otherCharges: numToInput(customer.otherCharges),
    cropCompensation: numToInput(customer.cropCompensation),
  };
}

export function emptyCustomerFormValues(): Record<string, string> {
  return Object.fromEntries(CUSTOMER_FORM_FIELD_NAMES.map((k) => [k, ""]));
}
