import { Job, JobStats } from '../../entities/job';

export interface JobQueueIndexView {
  setStats(stats: JobStats): void;
  setDetail(job: Job): void;
  onRetrySuccess(): void;
  onRemoveSuccess(): void;
  onBulkDeleteSuccess(): void;
  onActionSettled(id: number): void;
}
