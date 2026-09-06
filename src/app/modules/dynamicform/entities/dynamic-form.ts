import { DynamicFormField } from './dynamic-form-field';

export type DynamicFormStatus = 'draft' | 'published' | 'closed';

/** One dynamic form row as served by the CMS endpoints. */
export interface DynamicForm {
  formID: number;
  title: string;
  slug: string;
  description: string;
  headerImageUrl: string;
  status: DynamicFormStatus;
  version: number;
  maxSubmission: number | null;
  isMultipleSubmit: boolean;
  requireLogin: boolean;
  startDate: string;
  endDate: string;
  confirmationMessage: string;
  redirectUrl: string;
  notifyEmails: string[] | null;
  sendConfirmationEmail: boolean;
  rateLimitPerIP: number;
  rateLimitWindowMinutes: number;
  gsheetEnabled: boolean;
  gsheetAvailable?: boolean;
  gsheetSpreadsheetUrl?: string;
  gsheetLastSyncDate?: string;
  gsheetLastSyncError?: string;
  gdriveAttachmentsUrl?: string;
  gdriveAssetsUrl?: string;
  totalSubmission: number;
  isActive: boolean;
  createdDate: string;
  creatorName: string;
  updatedDate: string;
  fieldCount?: number;
  publicUrl?: string;
  fields?: DynamicFormField[];
}

/** The public renderer payload (GET /public/dynamic-forms/:slug).
 *  Sections are built client-side by splitting `fields` on `section_break`. */
export interface PublicDynamicForm {
  formID: number;
  title: string;
  description: string;
  headerImageUrl: string;
  slug: string;
  status: DynamicFormStatus;
  requireLogin: boolean;
  isMultipleSubmit: boolean;
  maxSubmission: number | null;
  totalSubmission: number;
  endDate?: string;
  version: number;
  /** Server clock (unix millis) at render time — echoed back on submit for the
   *  <3s anti-bot timing check (techspec Part 2, S1). */
  formStartTs: number;
  fields: DynamicFormField[];
  prefillEmail?: string;
  draftAnswers?: Record<string, unknown>;
  isPreview: boolean;
}

/** Reply of the public submit endpoint. */
export interface SubmitResult {
  slug: string;
  redirectUrl: string;
  confirmationMessage: string;
  isMultipleSubmit: boolean;
}

/** Reply of the gsheet connect/resync/disconnect endpoints. */
export interface GSheetStatus {
  enabled: boolean;
  spreadsheetUrl: string;
  lastSyncDate: string;
  lastSyncError: string;
}
