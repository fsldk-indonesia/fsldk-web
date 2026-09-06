import { FieldError } from '../../../../core/entities/api-response';
import { PublicDynamicForm, SubmitResult } from '../../entities/dynamic-form';

/** Machine reason for a non-accepting form — drives the 7 "closed" copies. */
export type ClosedReason =
  | 'needs_login' | 'already_submitted' | 'closed' | 'draft'
  | 'quota_full' | 'ended' | 'not_started';

export interface DynamicFormPublicFillView {
  setForm(form: PublicDynamicForm): void;
  showClosed(message: string, reason?: ClosedReason): void;
  redirectToLogin(returnUrl: string): void;
  setSubmitting(submitting: boolean): void;
  onSubmitSuccess(result: SubmitResult): void;
  onValidationErrors(errors: FieldError[]): void;
  onRateLimited(retryAfterSeconds: number, message: string): void;
  onDraftFileStaged(fieldID: number, fileName: string): void;
  onDraftFileRemoved(fieldID: number): void;
  onDraftSaved(): void;
}
