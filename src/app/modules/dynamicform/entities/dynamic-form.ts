import { DynamicFormField, DynamicFormSection } from './dynamic-form-field';

export type DynamicFormStatus = 'draft' | 'published' | 'closed' | 'archived';

export interface DynamicFormCollaborator {
  userID: number;
  role: 'editor' | 'manager';
  userName: string;
  userEmail: string;
}

/** One dynamic form row as served by the CMS endpoints. */
export interface DynamicForm {
  formID: number;
  title: string;
  slug: string;
  description: string;
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
  gsheetSpreadsheetUrl?: string;
  gsheetLastSyncDate?: string;
  gsheetLastSyncError?: string;
  totalSubmission: number;
  isActive: boolean;
  createdDate: string;
  creatorName: string;
  updatedDate: string;
  fieldCount?: number;
  publicUrl?: string;
  collaborators?: DynamicFormCollaborator[];
  sections?: DynamicFormSection[];
  fields?: DynamicFormField[];
}

/** The public renderer payload (GET /public/dynamic-forms/:slug). */
export interface PublicDynamicForm {
  formID: number;
  title: string;
  description: string;
  slug: string;
  status: DynamicFormStatus;
  requireLogin: boolean;
  isMultipleSubmit: boolean;
  version: number;
  sections: DynamicFormSection[];
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
