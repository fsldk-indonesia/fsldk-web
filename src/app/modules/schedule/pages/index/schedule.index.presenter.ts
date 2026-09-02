import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ScheduleRepository } from '../../repositories/schedule.repository';
import { Schedule } from '../../entities/schedule';
import { ScheduleIndexView } from './schedule.index.view';

export interface ScheduleIndexFilter {
  search: string;
  category: string;
  month: number;
  year: number | null;
  dateFrom: string;
  dateTo: string;
}

@Injectable()
export class ScheduleIndexPresenter extends BasePresenter<ScheduleIndexView> {
  private repo = inject(ScheduleRepository);
  private toast = inject(ToastService);

  load(page: number, limit: number, f: ScheduleIndexFilter): void {
    this.repo.cmsList({
      page,
      limit,
      sort: '-startDate',
      search: f.search || undefined,
      category: f.category || undefined,
      month: f.month || undefined,
      year: f.year || undefined,
      dateFrom: f.dateFrom || undefined,
      dateTo: f.dateTo || undefined,
    }).subscribe({
      next: (p) => this.view.setSchedules(p.data, p.count),
      error: () => {},
    });
  }

  togglePublish(s: Schedule): void {
    this.repo.publish(s.scheduleID, !s.isActive).subscribe({
      next: () => {
        this.toast.success(s.isActive ? 'Jadwal dinonaktifkan' : 'Jadwal diaktifkan');
        this.view.onPublishToggleSuccess();
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
}
