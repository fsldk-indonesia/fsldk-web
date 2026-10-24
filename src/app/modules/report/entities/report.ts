export type ExportFormat = 'xlsx' | 'csv';

/** Nilai filter Laporan Levelisasi/Pendataan — mirror report_dto.ReportFilter
 *  backend. Semua array = multi-select (dikirim sebagai repeated query param
 *  lewat ApiService.toParams). levelCodes diabaikan backend untuk Pendataan
 *  (TechSpec-Report-Revamp.md DL-4) — tetap dideklarasikan di sini supaya satu
 *  tipe dipakai kedua halaman, ReportPendataanPage cukup tidak mengisinya. */
export interface ReportFilterValue {
  statuses: string[];
  provinces: string[];
  cities: string[];
  puskomdaIDs: string[];
  levelCodes: string[];
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_REPORT_FILTER: ReportFilterValue = {
  statuses: [], provinces: [], cities: [], puskomdaIDs: [], levelCodes: [], dateFrom: '', dateTo: '',
};

/** Satu baris Laporan Levelisasi — mirror report_dto.SubmissionRow backend
 *  (BUKAN SubmissionResponse milik modul submission, sumbernya beda query). */
export interface ReportSubmissionRow {
  organizationName: string;
  parentOrganizationName?: string;
  provinceName?: string;
  cityName?: string;
  status: string;
  levelLabel?: string;
  submittedDate?: string;
  lastUpdatedDate?: string;
}

/** Satu tab versi form di Laporan Pendataan — mirror report_dto.PendataanTab. */
export interface PendataanTab {
  formVersionID: number;
  versionLabel: string;
  columns: string[];
  rows: string[][];
}
