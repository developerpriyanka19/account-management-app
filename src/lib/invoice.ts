/** Invoice builder types — billing customer + farmer line items. */

export type InvoiceBillingCustomerOption = {
  id: number;
  label: string;
  gstNumber: string;
  companyName: string | null;
};

export type InvoiceFarmerOption = {
  id: number;
  label: string;
  vendorCode: string | null;
  surveyNo: string | null;
};

export type InvoiceDraft = {
  billingCustomerId: number | null;
  farmerIds: number[];
  invoiceType: string;
  notes?: string;
};
