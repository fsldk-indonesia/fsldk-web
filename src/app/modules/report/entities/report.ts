export type ExportFormat = 'xlsx' | 'csv';

/** Nilai filter Laporan Levelisasi/Pendataan — mirror report_dto.ReportFilter
 *  backend. Semua array = multi-select (dikirim sebagai repeated query param
 *  lewat ApiService.toParams). levelCodes TIDAK pernah dikirim oleh
 *  ReportPendataanPage (Pendataan sengaja tidak punya UI filter Level,
 *  TechSpec-Report-Revamp.md DL-4) — backend sendiri tetap menerapkan filter
 *  ini kapan pun field-nya terisi (SubmissionRows tidak membedakan
 *  Levelisasi/Pendataan). Tetap dideklarasikan di sini supaya satu tipe
 *  dipakai kedua halaman, ReportPendataanPage cukup tidak mengisinya. */
export interface ReportFilterValue {
  statuses: string[];
  provinces: string[];
  cities: string[];
  puskomdaIDs: string[];
  /** Filter "Nama LDK" — opsinya sudah dibatasi sesuai scope caller di level
   *  UI (tier Puskomda cuma menawarkan LDK miliknya sendiri lewat filter
   *  `puskomda` di directory endpoint, tier Puskomnas menawarkan seluruh
   *  LDK), dikirim sebagai `ldkOrganizationID` (bukan `organizationID` —
   *  nama itu sudah dipakai param tunggal org-switcher). */
  organizationIDs: string[];
  levelCodes: string[];
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_REPORT_FILTER: ReportFilterValue = {
  statuses: [], provinces: [], cities: [], puskomdaIDs: [], organizationIDs: [], levelCodes: [], dateFrom: '', dateTo: '',
};

/** Satu baris Laporan Levelisasi — mirror report_dto.SubmissionRow backend
 *  (BUKAN SubmissionResponse milik modul submission, sumbernya beda query). */
export interface ReportSubmissionRow {
  submissionID: number;
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

/** Nilai filter Laporan Sensus Kader (Ringkasan & Pendataan) — mirror
 *  report_dto.KaderFilter backend. TIDAK reuse ReportFilterValue — Sensus
 *  Kader tidak punya konsep Level, menjaga field yang selalu kosong tidak
 *  diam-diam ada di satu tipe gabungan. */
export interface KaderFilterValue {
  statuses: string[];
  provinces: string[];
  cities: string[];
  puskomdaIDs: string[];
  organizationIDs: string[];
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_KADER_FILTER: KaderFilterValue = {
  statuses: [], provinces: [], cities: [], puskomdaIDs: [], organizationIDs: [], dateFrom: '', dateTo: '',
};

/** Satu baris Laporan Sensus Kader — mirror report_dto.KaderReportRow
 *  backend. status adalah ms_kader.status ("Status Keanggotaan":
 *  PENDING/ACTIVE/REJECTED/INACTIVE) — terjemahkan lewat KADER_STATUS_LABELS
 *  (modules/submission/entities/submission.ts), BUKAN SUBMISSION_STATUS_LABELS. */
export interface KaderReportRow {
  kaderID: number;
  submissionID: number;
  uniqueCode?: string;
  fullName: string;
  organizationName: string;
  parentOrganizationName?: string;
  provinceName?: string;
  cityName?: string;
  status: string;
  issuedDate?: string;
  submittedDate?: string;
}
