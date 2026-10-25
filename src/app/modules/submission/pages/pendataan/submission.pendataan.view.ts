import { FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { SubmissionDetail } from '../../entities/submission';
import { OrgPickerOption } from '../../../../shared/org-picker.component';
import { FieldError } from '../../../../core/entities/api-response';

export interface SubmissionPendataanView {
  setVersion(version: FormVersionDetail): void;
  setSubmission(detail: SubmissionDetail | null): void;
  setLdkOptions(options: OrgPickerOption[]): void;
  setLoading(loading: boolean): void;
  setBusy(busy: boolean): void;
  reload(): void;
  onValidationErrors(errors: FieldError[]): void;
}
