import {
  createDocumentModulePage,
  createDocumentModulePageMetadata,
} from "@/lib/create-document-module-page";
const item = {
  label: "Land DD Execution",
  href: "/debit-note/land-dd-execution",
  pageTitle: "Land DD Execution",
};

export const metadata = createDocumentModulePageMetadata(item);
export default createDocumentModulePage({ item, groupLabel: "Debit Note" });
