import {
  createDocumentModulePage,
  createDocumentModulePageMetadata,
} from "@/lib/create-document-module-page";

const item = {
  label: "Service Order",
  href: "/debit-note/service-order",
  pageTitle: "Service Order",
};

export const metadata = createDocumentModulePageMetadata(item);
export default createDocumentModulePage({ item, groupLabel: "Debit Notes" });
