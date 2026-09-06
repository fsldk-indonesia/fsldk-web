import { DynamicFormField } from './dynamic-form-field';

/** One rekap table row. answers maps "field_<id>" -> display value. */
export interface DynamicFormSubmissionRow {
  submissionID: number;
  respondentEmail: string;
  respondentName: string;
  isValid: boolean;
  submittedDate: string;
  answers: Record<string, string>;
}

export interface DynamicFormSubmissionFileRef {
  fieldID: number;
  fileURL: string;
  originalFileName: string;
}

/** One full submission for the CMS edit page. */
export interface DynamicFormSubmissionDetail {
  submissionID: number;
  formID: number;
  respondentEmail: string;
  respondentName: string;
  isValid: boolean;
  formVersion: number;
  submittedDate: string;
  answers: Record<string, string>;
  fields: DynamicFormField[];
  files: DynamicFormSubmissionFileRef[] | null;
}
