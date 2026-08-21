export type FieldType =
  | 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE'
  | 'SELECT' | 'MULTISELECT' | 'RADIO' | 'CHECKBOX'
  | 'FILE_DOCUMENT' | 'FILE_IMAGE';

export const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'TEXT', label: 'Teks Pendek' },
  { value: 'TEXTAREA', label: 'Teks Panjang' },
  { value: 'NUMBER', label: 'Angka' },
  { value: 'DATE', label: 'Tanggal' },
  { value: 'SELECT', label: 'Pilihan Tunggal (Dropdown)' },
  { value: 'RADIO', label: 'Pilihan Tunggal (Radio)' },
  { value: 'MULTISELECT', label: 'Pilihan Ganda (Dropdown)' },
  { value: 'CHECKBOX', label: 'Pilihan Ganda (Checkbox)' },
  { value: 'FILE_DOCUMENT', label: 'Berkas Dokumen' },
  { value: 'FILE_IMAGE', label: 'Berkas Gambar' },
];

export const OPTION_FIELD_TYPES: FieldType[] = ['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX'];

/** Field Single Choice — satu-satunya tipe yang boleh pakai scoring
 *  ScoringMethod "AUTOMATIC" (enhancement Flexible Scoring). */
export const SINGLE_CHOICE_FIELD_TYPES: FieldType[] = ['SELECT', 'RADIO'];

export type ScoringMethod = 'AUTOMATIC' | 'MANUAL';

/** Satu baris ms_submission_form. */
export interface SubmissionForm {
  formID: number;
  formCode: string;
  formName: string;
  description?: string;
  isActive: boolean;
  createdDate: string;
}

export interface FormVersionSummary {
  versionID: number;
  versionNumber: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedDate?: string;
}

export interface SubmissionFormDetail extends SubmissionForm {
  versions: FormVersionSummary[];
}

export interface FormOption {
  optionID: number;
  optionValue: string;
  optionLabel: string;
  sortOrder: number;
  isActive: boolean;
  /** Hanya relevan bila field induk useScoring && scoringMethod==='AUTOMATIC'. */
  score?: number;
}

export interface FormField {
  fieldID: number;
  sectionID: number;
  fieldCode: string;
  fieldLabel: string;
  fieldType: FieldType;
  isRequired: boolean;
  sortOrder: number;
  validationRule?: Record<string, unknown>;
  conditionalOnFieldID?: number;
  conditionalRule?: { operator: 'equals' | 'notEquals'; value: string };
  helpText?: string;
  /** Konfigurasi scoring (enhancement Flexible Scoring) — skala bebas, tidak
   *  dikunci ke 1-4. scoringMethod hanya terisi bila useScoring true. */
  useScoring: boolean;
  scoringMethod?: ScoringMethod;
  minScore?: number;
  maxScore?: number;
  weight?: number;
  options: FormOption[];
}

export interface FormSection {
  sectionID: number;
  sectionCode: string;
  sectionLabel: string;
  sortOrder: number;
  description?: string;
  fields: FormField[];
}

export interface FormVersionDetail {
  versionID: number;
  formID: number;
  versionNumber: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedDate?: string;
  sections: FormSection[];
}
