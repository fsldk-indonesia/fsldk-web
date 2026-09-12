import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ShortlinkRequestRepository } from '../../repositories/shortlinkrequest.repository';
import { ShortLinkRequest } from '../../entities/shortlink-request';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ShortLinkRequestIndexView } from './shortlinkrequest.index.view';

@Injectable()
export class ShortLinkRequestIndexPresenter extends BasePresenter<ShortLinkRequestIndexView> {
  private shortlinkRequestRepo = inject(ShortlinkRequestRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — status multi-select digabung
   *  comma-separated (backend parse lewat dto.ParseCSV, lihat
   *  shortlinkrequest_handler_impl.go), search dipetakan ke satu target
   *  gabungan (requesterName/requesterEmail/destinationURL, lihat
   *  shortlinkrequest_repository_impl.go List()). */
  list(params: CmsListParams): Observable<Pagination<ShortLinkRequest>> {
    return this.shortlinkRequestRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      status: params.status.join(','),
      search: (params.filters['search'] ?? [])[0] ?? '',
      dateFrom: params.dateFrom, dateTo: params.dateTo,
    });
  }

  approve(id: number): void {
    this.shortlinkRequestRepo.approve(id).subscribe({
      next: () => { this.toast.success('Permintaan disetujui, shortlink berhasil dibuat'); this.view.onActionSettled(id); this.view.onApproveSuccess(); },
      error: () => this.view.onActionSettled(id),
    });
  }

  reject(id: number, reason: string): void {
    this.view.setRejectSaving(true);
    this.shortlinkRequestRepo.reject(id, reason).subscribe({
      next: () => { this.toast.success('Permintaan ditolak'); this.view.setRejectSaving(false); this.view.onRejectSuccess(); },
      error: () => this.view.setRejectSaving(false),
    });
  }
}
