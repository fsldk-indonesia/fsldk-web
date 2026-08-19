import { SubmissionFormDetail, FormVersionDetail } from '../../entities/submission-form';

export interface SubmissionFormBuilderView {
  setForm(form: SubmissionFormDetail): void;
  setVersion(version: FormVersionDetail): void;
  setBusy(busy: boolean): void;
  reload(): void;
}
