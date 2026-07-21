import { DebitNoteType } from "@/lib/debit-note-types";

export function debitNoteListPath(type: DebitNoteType): string {
  switch (type) {
    case DebitNoteType.LAND_CONVERSION:
      return "/debit-note/land-conversion";
    case DebitNoteType.LEASE_DEED_EXECUTION:
      return "/debit-note/lease-deed-execution";
    case DebitNoteType.SERVICE_ORDER:
      return "/debit-note/service-order";
    case DebitNoteType.ATL_POA:
      return "/debit-note/atl-poa-gpa";
    default:
      return "/debit-note/land-conversion";
  }
}

export function debitNoteCreatePath(type: DebitNoteType): string {
  return `${debitNoteListPath(type)}/create`;
}

export function debitNoteListTitle(type: DebitNoteType): string {
  switch (type) {
    case DebitNoteType.LAND_CONVERSION:
      return "Land Conversion Debit Notes";
    case DebitNoteType.LEASE_DEED_EXECUTION:
      return "Lease Deed Execution Debit Notes";
    case DebitNoteType.SERVICE_ORDER:
      return "Service Orders";
    case DebitNoteType.ATL_POA:
      return "ATL and POA/GPA Debit Notes";
    default:
      return "Debit Notes";
  }
}

export function debitNoteDocumentTitle(type: DebitNoteType): string {
  switch (type) {
    case DebitNoteType.LAND_CONVERSION:
      return "Land Conversion Debit Note";
    case DebitNoteType.LEASE_DEED_EXECUTION:
      return "Lease Deed Execution";
    case DebitNoteType.SERVICE_ORDER:
      return "Service Order";
    case DebitNoteType.ATL_POA:
      return "ATL and POA/GPA Debit Note";
    default:
      return "Debit Note";
  }
}

export function debitNoteCreateLabel(type: DebitNoteType): string {
  if (type === DebitNoteType.SERVICE_ORDER) {
    return "+ Create New Service Order";
  }
  return "+ Create New Debit Note";
}

export function debitNoteEmptyTitle(type: DebitNoteType): string {
  if (type === DebitNoteType.SERVICE_ORDER) {
    return "No Service Orders Found";
  }
  return "No Debit Notes Found";
}

export function debitNoteViewPath(id: number): string {
  return `/debit-note/${id}`;
}

export function debitNoteEditPath(id: number): string {
  return `/debit-note/${id}/edit`;
}

export function debitNotePdfPath(id: number): string {
  return `/debit-note/${id}?download=1`;
}
