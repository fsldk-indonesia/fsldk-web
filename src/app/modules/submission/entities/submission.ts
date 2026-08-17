export const FORM_CODE_LEVELISASI = 'LEVELISASI_LDK';
export const FORM_CODE_SENSUS_KADER = 'SENSUS_KADER';

export const EDITABLE_STATUSES = [
  'DRAFT', 'REVISION_REQUESTED_LDK', 'REVISION_REQUESTED_PUSKOMDA', 'REVISION_REQUESTED_PUSKOMNAS',
];

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
