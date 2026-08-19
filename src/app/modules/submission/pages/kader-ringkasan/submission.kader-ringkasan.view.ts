import { SubmissionDetail } from '../../entities/submission';

export interface SubmissionKaderRingkasanView {
  setSubmission(detail: SubmissionDetail | null): void;
  setLoading(loading: boolean): void;
}
