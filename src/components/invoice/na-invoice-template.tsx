import { InvoiceLayout } from "./invoice-layout";
import type { InvoiceDocumentData } from "@/lib/invoice-types";

type Props = {
  data: InvoiceDocumentData;
};

/** NA category invoice — matches paper NA invoice column layout. */
export function NaInvoiceTemplate({ data }: Props) {
  return <InvoiceLayout data={data} showNaColumns />;
}
