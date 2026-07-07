import type { InvoiceTotals } from "@/lib/invoice-calculations";

export type QuotationItem = {
  id: string;
  description: string;
  amount: number;
};

export type QuotationDocument = {
  refNo: string;
  quotationDate: string;
  customerName: string;
  customerGst: string;
  customerAddress: string;
  pinCode: string;
  state: string;
  subject: string;
  items: QuotationItem[];
  totals: InvoiceTotals;
  grandTotalInWords: string;
};

export type QuotationFormInput = {
  refNo: string;
  quotationDate: string;
  customerId: number | "";
  subject: string;
  items: QuotationItem[];
};
