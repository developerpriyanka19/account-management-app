import { CompanyBrandHeader } from "@/components/company-brand-header";

type Props = {
  compact?: boolean;
  documentTitle?: string;
};

export function InvoiceBrandHeader({ compact = false, documentTitle = "INVOICE" }: Props) {
  return <CompanyBrandHeader documentTitle={documentTitle} compact={compact} />;
}
