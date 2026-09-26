import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { JobQueueRepository } from '../../repositories/jobqueue.repository';
import { Job } from '../../entities/job';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsComboboxOption, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { JobQueueIndexView } from './jobqueue.index.view';

const QUEUE_OPTIONS: CmsComboboxOption[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Email' },
];

@Injectable()
export class JobQueueIndexPresenter extends BasePresenter<JobQueueIndexView> {
  private jobQueueRepo = inject(JobQueueRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param jobqueue_dto.ListFilter. Status (4 nilai: pending/
   *  processing/completed/failed, BUKAN sekadar aktif/nonaktif) & Queue
   *  keduanya benar-benar multi-select bermakna (mis. lihat failed+processing
   *  sekaligus untuk triase) — backend menerima CSV lewat IN clause. */
  list(params: CmsListParams): Observable<Pagination<Job>> {
    return this.jobQueueRepo.list({
      page: params.page, limit: params.limit, sort: params.sort,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['search'] ?? [])[0] ?? '',
      status: params.status.join(','),
      queue: (params.filters['queue'] ?? []).join(','),
    });
  }

  /** loadOptions untuk target-pencarian "Queue" (mode combobox, nilai tetap). */
  queueOptions(): Observable<CmsComboboxOption[]> {
    return of(QUEUE_OPTIONS);
  }

  loadStats(): void {
    this.jobQueueRepo.stats().subscribe({ next: (stats) => this.view.setStats(stats), error: () => {} });
  }

  loadDetail(id: number): void {
    this.jobQueueRepo.get(id).subscribe({
      next: (job) => this.view.setDetail(job),
      error: (err) => this.toast.error(err.error?.message || 'Gagal memuat detail job'),
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

  bulkDelete(ids: number[]): void {
    this.jobQueueRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} job terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
