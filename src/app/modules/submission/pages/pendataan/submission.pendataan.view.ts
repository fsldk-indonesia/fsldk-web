import { FormVersionDetail } from '../../../submission-form/entities/submission-form';
import { SubmissionDetail } from '../../entities/submission';
import { SelectOption } from '../../../../shared/select.component';

export interface SubmissionPendataanView {
  setVersion(version: FormVersionDetail): void;
  setSubmission(detail: SubmissionDetail | null): void;
  setLdkOptions(options: SelectOption[]): void;
  setLoading(loading: boolean): void;
  setBusy(busy: boolean): void;
  reload(): void;
}
