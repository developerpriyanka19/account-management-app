import { CompanyBrandHeader } from "@/components/company-brand-header";

type Props = {
  compact?: boolean;
};

export function InvoiceBrandHeader({ compact = false }: Props) {
  return <CompanyBrandHeader documentTitle="INVOICE" compact={compact} />;
}
