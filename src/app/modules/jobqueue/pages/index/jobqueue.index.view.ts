import { Job, JobStats } from '../../entities/job';

export interface JobQueueIndexView {
  setJobs(items: Job[], count: number): void;
  setStats(stats: JobStats): void;
  onActionSettled(id: number): void;
  onRetrySuccess(): void;
  onRemoveSuccess(): void;
}
