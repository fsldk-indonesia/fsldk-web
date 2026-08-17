import { SubmissionResponse, SubmissionDetail } from '../../entities/submission';
import { FormVersionDetail } from '../../../submission-form/entities/submission-form';

export interface SubmissionReviewQueueView {
  setQueue(items: SubmissionResponse[]): void;
  setOrgNames(names: Record<number, string>): void;
  setVersion(version: FormVersionDetail): void;
  setDetail(detail: SubmissionDetail): void;
  setLoading(loading: boolean): void;
  setBusy(busy: boolean): void;
  onDecisionSuccess(): void;
}
