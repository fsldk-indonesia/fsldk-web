import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { Job, JobStats } from '../../entities/job';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { JobQueueIndexPresenter } from './jobqueue.index.presenter';
import { JobQueueIndexView } from './jobqueue.index.view';

@Component({
  selector: 'app-jobqueue-index-page',
  standalone: true,
  templateUrl: './jobqueue.index.page.html',
  imports: [DatePipe, IconComponent, PaginationComponent],
  providers: [JobQueueIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-tile { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; }
    .stat-tile .value { font-size: 1.5rem; font-weight: 800; }
    .stat-tile .label { font-size: .8rem; color: var(--color-muted); }
    .stat-tile.stuck .value, .stat-tile.failed .value { color: var(--color-danger); }
    .last-error { font-size: .78rem; color: var(--color-danger); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }
    .filter-bar { flex-wrap: wrap; }
    .filter-select { width: auto; max-width: 220px; }
  `],
})
export class JobQueueIndexPage implements OnInit, JobQueueIndexView {
  private presenter = inject(JobQueueIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  jobs = signal<Job[]>([]);
  stats = signal<JobStats | null>(null);
  loading = signal(true);
  status = '';
  queue = '';
  page = signal(1);
  count = signal(0);
  readonly limit = 20;
  busy = signal<ReadonlySet<number>>(new Set());

  canRetry = this.auth.hasPermission('jobqueue.retry');
  canDelete = this.auth.hasPermission('jobqueue.delete');

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadStats();
    this.load();
  }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.status, this.queue); }
  filterStatus(s: string): void { this.status = s; this.page.set(1); this.load(); }
  filterQueue(q: string): void { this.queue = q; this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  retry(job: Job): void { this.setBusy(job.jobID); this.presenter.retry(job.jobID); }

  async remove(job: Job, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus job #${job.jobID} (${job.jobType})? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Job', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(job.jobID);
    this.presenter.remove(job.jobID);
  }

  setJobs(items: Job[], count: number): void { this.jobs.set(items); this.count.set(count); this.loading.set(false); }
  setStats(stats: JobStats): void { this.stats.set(stats); }
  onActionSettled(id: number): void { this.clearBusy(id); }
  onRetrySuccess(): void { this.load(); this.presenter.loadStats(); }
  onRemoveSuccess(): void { this.load(); this.presenter.loadStats(); }
}
