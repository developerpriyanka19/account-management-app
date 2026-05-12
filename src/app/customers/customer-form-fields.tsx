import type { CustomerFormFieldErrors } from "@/lib/customer-form-validation";

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-400/20";

const numClass = `${inputClass} tabular-nums`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
      {message}
    </p>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50/40 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/30 sm:p-6">
      <div className="border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function TextField({
  id,
  name,
  label,
  required,
  defaultValue,
  error,
  placeholder,
  span2,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  defaultValue: string;
  error?: string;
  placeholder?: string;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : undefined}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
      >
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={inputClass}
      />
      <FieldError message={error} />
    </div>
  );
}

function NumberField({
  id,
  name,
  label,
  defaultValue,
  error,
  placeholder = "0",
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={numClass}
      />
      <FieldError message={error} />
    </div>
  );
}

function DateField({
  id,
  name,
  label,
  defaultValue,
  error,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="date"
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        className={inputClass}
      />
      <FieldError message={error} />
    </div>
  );
}

function NotesField({
  defaultValue,
  error,
}: {
  defaultValue: string;
  error?: string;
}) {
  return (
    <div className="sm:col-span-2">
      <label
        htmlFor="notes"
        className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
      >
        Notes
      </label>
      <textarea
        id="notes"
        name="notes"
        rows={4}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        className={`${inputClass} resize-y`}
        placeholder="Optional remarks"
      />
      <FieldError message={error} />
    </div>
  );
}

type Props = {
  fieldErrors?: CustomerFormFieldErrors;
  defaultValues: Record<string, string>;
};

export function CustomerFormFields({ fieldErrors, defaultValues }: Props) {
  const d = (key: string) => defaultValues[key] ?? "";
  const e = (key: string) => fieldErrors?.[key];

  return (
    <div className="flex flex-col gap-8">
      <Section
        title="Basic details"
        description="Primary identification for the farmer and plot."
      >
        <TextField
          id="farmerName"
          name="farmerName"
          label="Farmer name"
          required
          defaultValue={d("farmerName")}
          error={e("farmerName")}
          span2
        />
        <TextField
          id="changedFarmerName"
          name="changedFarmerName"
          label="Changed farmer name"
          defaultValue={d("changedFarmerName")}
          error={e("changedFarmerName")}
          span2
        />
        <TextField
          id="vendorCode"
          name="vendorCode"
          label="Vendor code"
          required
          defaultValue={d("vendorCode")}
          error={e("vendorCode")}
        />
        <TextField
          id="surveyNo"
          name="surveyNo"
          label="Survey number"
          required
          defaultValue={d("surveyNo")}
          error={e("surveyNo")}
        />
        <TextField
          id="newSurveyNo"
          name="newSurveyNo"
          label="New survey number"
          defaultValue={d("newSurveyNo")}
          error={e("newSurveyNo")}
          span2
        />
      </Section>

      <Section title="RTC details" description="Record of rights (RTC) measurements.">
        <NumberField
          id="rtcExtentAcre"
          name="rtcExtentAcre"
          label="RTC extent (acre)"
          defaultValue={d("rtcExtentAcre")}
          error={e("rtcExtentAcre")}
        />
        <NumberField
          id="rtcExtentGunta"
          name="rtcExtentGunta"
          label="RTC extent (gunta)"
          defaultValue={d("rtcExtentGunta")}
          error={e("rtcExtentGunta")}
        />
        <NumberField
          id="rtcAKharab"
          name="rtcAKharab"
          label="RTC A kharab"
          defaultValue={d("rtcAKharab")}
          error={e("rtcAKharab")}
        />
        <NumberField
          id="rtcBKharab"
          name="rtcBKharab"
          label="RTC B kharab"
          defaultValue={d("rtcBKharab")}
          error={e("rtcBKharab")}
        />
      </Section>

      <Section title="Balance details" description="Remaining extent on record.">
        <NumberField
          id="balanceExtentAcre"
          name="balanceExtentAcre"
          label="Balance extent (acre)"
          defaultValue={d("balanceExtentAcre")}
          error={e("balanceExtentAcre")}
        />
        <NumberField
          id="balanceExtentGunta"
          name="balanceExtentGunta"
          label="Balance extent (gunta)"
          defaultValue={d("balanceExtentGunta")}
          error={e("balanceExtentGunta")}
        />
      </Section>

      <Section title="Lease details" description="Lease area and deed charges.">
        <NumberField
          id="leaseExtentAcre"
          name="leaseExtentAcre"
          label="Lease extent (acre)"
          defaultValue={d("leaseExtentAcre")}
          error={e("leaseExtentAcre")}
        />
        <NumberField
          id="leaseExtentGunta"
          name="leaseExtentGunta"
          label="Lease extent (gunta)"
          defaultValue={d("leaseExtentGunta")}
          error={e("leaseExtentGunta")}
        />
        <NumberField
          id="leaseAmount"
          name="leaseAmount"
          label="Lease amount"
          defaultValue={d("leaseAmount")}
          error={e("leaseAmount")}
        />
        <NumberField
          id="leaseDeedStampDuty"
          name="leaseDeedStampDuty"
          label="Lease deed stamp duty"
          defaultValue={d("leaseDeedStampDuty")}
          error={e("leaseDeedStampDuty")}
        />
        <NumberField
          id="leaseDeedRegCharges"
          name="leaseDeedRegCharges"
          label="Lease deed registration charges"
          defaultValue={d("leaseDeedRegCharges")}
          error={e("leaseDeedRegCharges")}
        />
      </Section>

      <Section title="Area details" description="Totals for quick reference.">
        <NumberField
          id="totalGunta"
          name="totalGunta"
          label="Total gunta"
          defaultValue={d("totalGunta")}
          error={e("totalGunta")}
        />
        <NumberField
          id="totalCents"
          name="totalCents"
          label="Total cents"
          defaultValue={d("totalCents")}
          error={e("totalCents")}
        />
      </Section>

      <Section title="Rent details" description="Rent and related deductions.">
        <NumberField
          id="rentPerAcre"
          name="rentPerAcre"
          label="Rent per acre"
          defaultValue={d("rentPerAcre")}
          error={e("rentPerAcre")}
        />
        <NumberField
          id="balanceRentAmount"
          name="balanceRentAmount"
          label="Balance rent amount"
          defaultValue={d("balanceRentAmount")}
          error={e("balanceRentAmount")}
        />
        <NumberField
          id="rentAmount"
          name="rentAmount"
          label="Rent amount"
          defaultValue={d("rentAmount")}
          error={e("rentAmount")}
        />
        <NumberField
          id="tdsAmount"
          name="tdsAmount"
          label="TDS amount"
          defaultValue={d("tdsAmount")}
          error={e("tdsAmount")}
        />
      </Section>

      <Section
        title="Advance payment (AES)"
        description="Advance cheque details for AES."
      >
        <NumberField
          id="aesAdvanceChequeAmount"
          name="aesAdvanceChequeAmount"
          label="AES advance cheque amount"
          defaultValue={d("aesAdvanceChequeAmount")}
          error={e("aesAdvanceChequeAmount")}
        />
        <DateField
          id="aesAdvanceDate"
          name="aesAdvanceDate"
          label="AES advance date"
          defaultValue={d("aesAdvanceDate")}
          error={e("aesAdvanceDate")}
        />
        <TextField
          id="aesAdvanceChequeNo"
          name="aesAdvanceChequeNo"
          label="AES advance cheque number"
          defaultValue={d("aesAdvanceChequeNo")}
          error={e("aesAdvanceChequeNo")}
        />
        <TextField
          id="aesAdvanceBankName"
          name="aesAdvanceBankName"
          label="AES advance bank name"
          defaultValue={d("aesAdvanceBankName")}
          error={e("aesAdvanceBankName")}
          span2
        />
      </Section>

      <Section title="Shortage details" description="Shortage settlement cheque.">
        <NumberField
          id="shortageChequeAmount"
          name="shortageChequeAmount"
          label="Shortage cheque amount"
          defaultValue={d("shortageChequeAmount")}
          error={e("shortageChequeAmount")}
        />
        <DateField
          id="shortageDate"
          name="shortageDate"
          label="Shortage date"
          defaultValue={d("shortageDate")}
          error={e("shortageDate")}
        />
        <TextField
          id="shortageChequeNo"
          name="shortageChequeNo"
          label="Shortage cheque number"
          defaultValue={d("shortageChequeNo")}
          error={e("shortageChequeNo")}
        />
        <TextField
          id="shortageBankName"
          name="shortageBankName"
          label="Shortage bank name"
          defaultValue={d("shortageBankName")}
          error={e("shortageBankName")}
          span2
        />
      </Section>

      <Section title="ATL charges" description="Agreement to lease — stamp, registration, total.">
        <NumberField
          id="atlStampDuty"
          name="atlStampDuty"
          label="ATL stamp duty"
          defaultValue={d("atlStampDuty")}
          error={e("atlStampDuty")}
        />
        <NumberField
          id="atlRegCharges"
          name="atlRegCharges"
          label="ATL registration charges"
          defaultValue={d("atlRegCharges")}
          error={e("atlRegCharges")}
        />
        <NumberField
          id="atlTotal"
          name="atlTotal"
          label="ATL total"
          defaultValue={d("atlTotal")}
          error={e("atlTotal")}
        />
      </Section>

      <Section title="PAO charges" description="Power of attorney — charges and total.">
        <NumberField
          id="paoStampDuty"
          name="paoStampDuty"
          label="PAO stamp duty"
          defaultValue={d("paoStampDuty")}
          error={e("paoStampDuty")}
        />
        <NumberField
          id="paoRegCharges"
          name="paoRegCharges"
          label="PAO registration charges"
          defaultValue={d("paoRegCharges")}
          error={e("paoRegCharges")}
        />
        <NumberField
          id="paoTotal"
          name="paoTotal"
          label="PAO total"
          defaultValue={d("paoTotal")}
          error={e("paoTotal")}
        />
      </Section>

      <Section title="Other charges" description="Conversion, podi, and crop compensation.">
        <NumberField
          id="landConversion"
          name="landConversion"
          label="Land conversion"
          defaultValue={d("landConversion")}
          error={e("landConversion")}
        />
        <NumberField
          id="podiFee"
          name="podiFee"
          label="Podi fee"
          defaultValue={d("podiFee")}
          error={e("podiFee")}
        />
        <NumberField
          id="cropCompensation"
          name="cropCompensation"
          label="Crop compensation"
          defaultValue={d("cropCompensation")}
          error={e("cropCompensation")}
        />
      </Section>

      <Section title="Debit note" description="Debit note reference and amount.">
        <TextField
          id="debitNoteNo"
          name="debitNoteNo"
          label="Debit note number"
          defaultValue={d("debitNoteNo")}
          error={e("debitNoteNo")}
        />
        <NumberField
          id="debitNoteAmount"
          name="debitNoteAmount"
          label="Debit note amount"
          defaultValue={d("debitNoteAmount")}
          error={e("debitNoteAmount")}
        />
      </Section>

      <Section title="Received details" description="Payments received and balance due.">
        <NumberField
          id="receivedNeftAmount"
          name="receivedNeftAmount"
          label="Received NEFT amount"
          defaultValue={d("receivedNeftAmount")}
          error={e("receivedNeftAmount")}
        />
        <DateField
          id="receivedDate"
          name="receivedDate"
          label="Received date"
          defaultValue={d("receivedDate")}
          error={e("receivedDate")}
        />
        <NumberField
          id="balanceReceivable"
          name="balanceReceivable"
          label="Balance receivable"
          defaultValue={d("balanceReceivable")}
          error={e("balanceReceivable")}
        />
      </Section>

      <Section title="Additional" description="Loan and free-form notes.">
        <NumberField
          id="loanAmount"
          name="loanAmount"
          label="Loan amount"
          defaultValue={d("loanAmount")}
          error={e("loanAmount")}
        />
        <NotesField defaultValue={d("notes")} error={e("notes")} />
      </Section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        <span className="text-red-500">*</span> Required fields only in Basic details. Numbers can
        include decimals; leave blank when not applicable.
      </p>
    </div>
  );
}
