import { FieldError } from '../../../../core/entities/api-response';
import { PublicDynamicForm, SubmitResult } from '../../entities/dynamic-form';

export interface DynamicFormPublicFillView {
  setForm(form: PublicDynamicForm): void;
  showClosed(message: string): void;
  redirectToLogin(returnUrl: string): void;
  setSubmitting(submitting: boolean): void;
  onSubmitSuccess(result: SubmitResult): void;
  onValidationErrors(errors: FieldError[]): void;
  onRateLimited(retryAfterSeconds: number, message: string): void;
  onDraftFileStaged(fieldID: number, fileName: string): void;
  onDraftFileRemoved(fieldID: number): void;
}
