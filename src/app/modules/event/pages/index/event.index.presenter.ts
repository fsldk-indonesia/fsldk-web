import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { EventRepository } from '../../repositories/event.repository';
import { Event as AppEvent } from '../../entities/event';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { EventIndexView } from './event.index.view';

@Injectable()
export class EventIndexPresenter extends BasePresenter<EventIndexView> {
  private eventRepo = inject(EventRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param event_dto.CMSFilter (filters['title']/['division'] dipetakan
   *  ke search/division, filters['timing'] ke timing, params.status ke status
   *  publikasi). Division/timing/status multi-select digabung comma-separated
   *  — backend parse lewat splitQuery (lihat event_handler_impl.go). */
  list(params: CmsListParams): Observable<Pagination<AppEvent>> {
    return this.eventRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort, status: params.status.join(','),
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['title'] ?? [])[0] ?? '',
      division: (params.filters['division'] ?? [])[0] ?? '',
      timing: (params.filters['timing'] ?? []).join(','),
    });
  }

  remove(e: AppEvent): void {
    this.eventRepo.remove(e.eventID).subscribe({
      next: () => { this.toast.success('Event dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(e.eventID); },
      error: () => this.view.onActionSettled(e.eventID),
    });
  }

  bulkDelete(ids: number[]): void {
    this.eventRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} event terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
