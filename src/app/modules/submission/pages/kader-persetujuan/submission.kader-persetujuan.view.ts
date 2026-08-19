import { KaderInfo, SubmissionDetail } from '../../entities/submission';
import { FormVersionDetail } from '../../../submission-form/entities/submission-form';

export interface SubmissionKaderPersetujuanView {
  setPending(items: KaderInfo[]): void;
  setActive(items: KaderInfo[]): void;
  setRejected(items: KaderInfo[]): void;
  setVersion(version: FormVersionDetail): void;
  setDetail(detail: SubmissionDetail): void;
  setLoading(loading: boolean): void;
  setBusy(busy: boolean): void;
  onDecisionSuccess(): void;
  onDeactivateSuccess(): void;
  onReinstateSuccess(): void;
}
