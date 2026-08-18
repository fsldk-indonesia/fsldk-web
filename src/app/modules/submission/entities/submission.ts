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

export interface SubmissionDetail extends SubmissionResponse {
  answers: AnswerResponse[];
  statusHistory: StatusHistoryEntry[];
  levelResult?: LevelResult;
  kader?: KaderInfo;
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
