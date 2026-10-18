import { FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { SubmissionDetail } from '../../entities/submission';
import { SelectOption } from '../../../../shared/select.component';
import { FieldError } from '../../../../core/entities/api-response';

export interface SubmissionPendataanView {
  setVersion(version: FormVersionDetail): void;
  setSubmission(detail: SubmissionDetail | null): void;
  setLdkOptions(options: SelectOption[]): void;
  setLoading(loading: boolean): void;
  setBusy(busy: boolean): void;
  reload(): void;
  onValidationErrors(errors: FieldError[]): void;
}
