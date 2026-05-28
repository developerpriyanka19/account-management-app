import {
  createDocumentModulePage,
  createDocumentModulePageMetadata,
} from "@/lib/create-document-module-page";
const item = {
  label: "Execution of Survey and Boundaries",
  href: "/debit-note/execution-of-survey-and-boundaries",
  pageTitle: "Execution of Survey and Boundaries",
};

export const metadata = createDocumentModulePageMetadata(item);
export default createDocumentModulePage({ item, groupLabel: "Debit Note" });
