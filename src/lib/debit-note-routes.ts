import { DebitNoteType } from "@/lib/debit-note-types";

export function debitNoteListPath(type: DebitNoteType): string {
  return type === DebitNoteType.LAND_CONVERSION
    ? "/debit-note/land-conversion"
    : "/debit-note/atl-poa-gpa";
}

export function debitNoteCreatePath(type: DebitNoteType): string {
  return `${debitNoteListPath(type)}/create`;
}

export function debitNoteListTitle(type: DebitNoteType): string {
  return type === DebitNoteType.LAND_CONVERSION
    ? "Land Conversion Debit Notes"
    : "ATL and POA/GPA Debit Notes";
}

export function debitNoteCreateLabel(type: DebitNoteType): string {
  return "+ Create New Debit Note";
}

export function debitNoteEmptyTitle(type: DebitNoteType): string {
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
