import { SubmissionDetail } from '../../entities/submission';

export interface SubmissionStatusView {
  setSubmission(detail: SubmissionDetail | null): void;
  setLoading(loading: boolean): void;
  setBusy(busy: boolean): void;
}
