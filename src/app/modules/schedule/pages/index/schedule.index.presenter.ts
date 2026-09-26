import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ScheduleRepository } from '../../repositories/schedule.repository';
import { Schedule } from '../../entities/schedule';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ScheduleIndexView } from './schedule.index.view';

@Injectable()
export class ScheduleIndexPresenter extends BasePresenter<ScheduleIndexView> {
  private repo = inject(ScheduleRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param schedule_dto.Filter (filters['title']/['category'] dipetakan
   *  ke search/category, params.status ke status aktif/nonaktif, dateFrom/
   *  dateTo ke jendela overlap tanggal yang sudah didukung backend). */
  list(params: CmsListParams): Observable<Pagination<Schedule>> {
    return this.repo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort, status: params.status.join(','),
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['title'] ?? [])[0] ?? '',
      category: (params.filters['category'] ?? [])[0] ?? '',
    });
  }

  togglePublish(s: Schedule): void {
    this.repo.publish(s.scheduleID, !s.isActive).subscribe({
      next: () => {
        this.toast.success(s.isActive ? 'Jadwal dinonaktifkan' : 'Jadwal diaktifkan');
        this.view.onPublishToggleSuccess(s.isActive);
        this.view.onActionSettled(s.scheduleID);
      },
      error: () => this.view.onActionSettled(s.scheduleID),
    });
  }

  remove(s: Schedule): void {
    this.repo.remove(s.scheduleID).subscribe({
      next: () => {
        this.toast.success('Jadwal dihapus');
        this.view.onRemoveSuccess();
        this.view.onActionSettled(s.scheduleID);
      },
      error: () => this.view.onActionSettled(s.scheduleID),
    });
  }

  bulkDelete(ids: number[]): void {
    this.repo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} jadwal terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
