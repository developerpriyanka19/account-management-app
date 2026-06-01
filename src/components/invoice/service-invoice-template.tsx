import { InvoiceLayout } from "./invoice-layout";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
};

/** Service category invoice — description-focused line items. */
export function ServiceInvoiceTemplate({ data }: Props) {
  return <InvoiceLayout data={data} showNaColumns={false} />;
}

