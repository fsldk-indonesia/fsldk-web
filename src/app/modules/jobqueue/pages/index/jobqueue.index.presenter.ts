import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { JobQueueRepository } from '../../repositories/jobqueue.repository';
import { JobQueueIndexView } from './jobqueue.index.view';

@Injectable()
export class JobQueueIndexPresenter extends BasePresenter<JobQueueIndexView> {
  private jobQueueRepo = inject(JobQueueRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, status: string, queue: string): void {
    this.jobQueueRepo.list({ page, limit, status, queue }).subscribe({
      next: (p) => this.view.setJobs(p.data, p.count),
      error: () => {},
    });
  }

  loadStats(): void {
    this.jobQueueRepo.stats().subscribe({
      next: (stats) => this.view.setStats(stats),
      error: () => {},
    });
  }

  retry(id: number): void {
    this.jobQueueRepo.retry(id).subscribe({
      next: () => { this.toast.success('Job akan dicoba ulang'); this.view.onActionSettled(id); this.view.onRetrySuccess(); },
      error: () => this.view.onActionSettled(id),
    });
  }

  remove(id: number): void {
    this.jobQueueRepo.remove(id).subscribe({
      next: () => { this.toast.success('Job dihapus'); this.view.onActionSettled(id); this.view.onRemoveSuccess(); },
      error: () => this.view.onActionSettled(id),
    });
  }
}
