/** Shared report types and constants (safe for client + server imports). */

export const REPORTS_PAGE_SIZE = 25;

export type ReportLocationFilter = {
  state?: string;
  district?: string;
  taluk?: string;
  hobbli?: string;
  village?: string;
  q?: string;
};

export type FarmerListReportRow = {
  id: number;
  farmerName: string;
  changedFarmerName: string;
  vendorCode: string;
  surveyNo: string;
  newSurveyNo: string;
  state: string;
  district: string;
  taluk: string;
  hobbli: string;
  village: string;
  acres: number | null;
  guntas: number | null;
  aKharab: number | null;
  bKharab: number | null;
};
