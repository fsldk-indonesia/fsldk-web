export const FORM_CODE_LEVELISASI = 'LEVELISASI_LDK';
export const FORM_CODE_SENSUS_KADER = 'SENSUS_KADER';

export const EDITABLE_STATUSES = [
  'DRAFT', 'REVISION_REQUESTED_LDK', 'REVISION_REQUESTED_PUSKOMDA', 'REVISION_REQUESTED_PUSKOMNAS',
];

export type ReviewTier = 'LDK' | 'PUSKOMDA' | 'PUSKOMNAS';
export type ReviewDecision = 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';

/** Level Levelisasi yang diseed backend (lk_level) — tidak ada endpoint daftar level terpisah. */
export const LEVEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'PRA_MULA', label: 'Pra Mula' },
  { value: 'MULA', label: 'Mula' },
  { value: 'MADYA', label: 'Madya' },
  { value: 'MANDIRI', label: 'Mandiri' },
];

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draf', SUBMITTED: 'Terkirim', CANCELLED: 'Dibatalkan', REJECTED: 'Ditolak',
  PUSKOMDA_REVIEW: 'Verifikasi Puskomda', REVISION_REQUESTED_PUSKOMDA: 'Revisi Diminta (Puskomda)',
  APPROVED_PUSKOMDA: 'Disetujui Puskomda', PUSKOMNAS_REVIEW: 'Verifikasi Puskomnas',
  REVISION_REQUESTED_PUSKOMNAS: 'Revisi Diminta (Puskomnas)', APPROVED_PUSKOMNAS: 'Disetujui Puskomnas',
  LEVEL_ESTABLISHED: 'Level Ditetapkan',
  PUBLISHED: 'Dipublikasikan', LDK_REVIEW: 'Verifikasi LDK', REVISION_REQUESTED_LDK: 'Revisi Diminta (LDK)',
  APPROVED_LDK: 'Disetujui LDK', CODE_ISSUED: 'Kode Terbit', ACTIVE: 'Aktif',
};

/** Status yang perlu ditonjolkan beda warna/nada (ditolak = merah, minta
 *  revisi = kuning/amber) — dipakai banner/kartu status di Ringkasan,
 *  Formulir Pendataan, Status Pendataan, & Profil Saya Portal Kader supaya
 *  konsisten satu sumber kebenaran nada warna per status. */
export type StatusTone = 'danger' | 'warning' | 'success' | 'neutral';
export const STATUS_TONE: Record<string, StatusTone> = {
  REJECTED: 'danger',
  REVISION_REQUESTED_LDK: 'warning', REVISION_REQUESTED_PUSKOMDA: 'warning', REVISION_REQUESTED_PUSKOMNAS: 'warning',
  ACTIVE: 'success', APPROVED_LDK: 'success', APPROVED_PUSKOMDA: 'success', APPROVED_PUSKOMNAS: 'success',
  LEVEL_ESTABLISHED: 'success', PUBLISHED: 'success', CODE_ISSUED: 'success',
};
export function statusTone(status: string): StatusTone { return STATUS_TONE[status] ?? 'neutral'; }

export const KADER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu Persetujuan', ACTIVE: 'Aktif', REJECTED: 'Ditolak', INACTIVE: 'Nonaktif',
};
export const KADER_STATUS_TONE: Record<string, StatusTone> = {
  PENDING: 'warning', ACTIVE: 'success', REJECTED: 'danger', INACTIVE: 'neutral',
};
export function kaderStatusTone(status: string): StatusTone { return KADER_STATUS_TONE[status] ?? 'neutral'; }

export interface AnswerInput {
  fieldID: number;
  valueText?: string;
  valueNumber?: number;
  valueDate?: string;
  valueOptionID?: number;
  valueOptionIDs?: number[];
  valueFileURL?: string;
  valueFileName?: string;
}

export interface AnswerResponse {
  fieldID: number;
  fieldCode: string;
  valueText?: string;
  valueNumber?: number;
  valueDate?: string;
  valueOptionID?: number;
  valueOptionIDs?: number[];
  valueFileURL?: string;
  valueFileName?: string;
}

export interface StatusHistoryEntry {
  fromStatus?: string;
  toStatus: string;
  actorUserID: number;
  note?: string;
  createdDate: string;
}

export interface LevelResult {
  resultID: number;
  levelCode: string;
  levelLabel?: string;
  justificationNote?: string;
  establishedDate: string;
  isPublished: boolean;
  publishedDate?: string;
}

export interface KaderInfo {
  kaderID: number;
  submissionID: number;
  organizationID: number;
  /** Hanya terisi saat status ACTIVE (disetujui) — lihat submission_service_impl.go Get(). */
  organizationName?: string;
  parentOrganizationName?: string;
  uniqueCode?: string;
  fullName: string;
  status: string;
  issuedDate?: string;
}

export interface SubmissionResponse {
  submissionID: number;
  formID: number;
  formCode: string;
  formVersionID: number;
  organizationID: number;
  subjectType: 'ORGANIZATION' | 'KADER';
  status: string;
  version: number;
  submittedDate?: string;
  createdDate: string;
}

/** Breakdown skor satu field UseScoring — enhancement Flexible Scoring, murni
 *  informatif untuk Puskomnas (lihat ConsolidatedScoreResponse). */
export interface FieldScoreResponse {
  fieldID: number;
  fieldCode: string;
  fieldLabel: string;
  hasScore: boolean;
  rawScore?: number;
  maxScore: number;
  normalized?: number;
  weight: number;
  weightedScore?: number;
  source: 'AUTOMATIC' | 'MANUAL';
}

export interface ConsolidatedScoreResponse {
  fields: FieldScoreResponse[];
  finalScore: number;
  /** false bila ada field UseScoring yang belum dijawab/belum diberi skor —
   *  finalScore belum final selama ini false. */
  isComplete: boolean;
}

export interface SubmissionDetail extends SubmissionResponse {
  answers: AnswerResponse[];
  statusHistory: StatusHistoryEntry[];
  levelResult?: LevelResult;
  kader?: KaderInfo;
  /** Hanya terisi untuk caller bertier Puskomnas pada submission Levelisasi
   *  — LDK/Puskomda tidak pernah menerima field ini dari backend. */
  consolidatedScore?: ConsolidatedScoreResponse;
}

export interface SaveFieldScoresRequest {
  scores: { fieldID: number; rawScore: number }[];
}

// ---------- Reviewer actions ----------

export interface ReviewRequest {
  decision: ReviewDecision;
  note: string;
  checklist?: Record<string, boolean>;
  version: number;
}

export interface EstablishLevelRequest {
  levelCode: string;
  justificationNote: string;
  version: number;
}

export interface VersionedRequest {
  version: number;
}

export interface ReopenRequest {
  reason: string;
  version: number;
}
