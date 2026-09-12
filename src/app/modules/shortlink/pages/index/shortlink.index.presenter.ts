import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ShortlinkRepository } from '../../repositories/shortlink.repository';
import { ShortLink } from '../../entities/shortlink';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { ShortlinkIndexView } from './shortlink.index.view';

export interface ShortlinkFormValue {
  destinationURL: string;
  shortKey: string;
}

@Injectable()
export class ShortlinkIndexPresenter extends BasePresenter<ShortlinkIndexView> {
  private shortlinkRepo = inject(ShortlinkRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — shortlink_dto.ListFilter cuma
   *  punya satu kolom pencarian gabungan (shortKey ATAU destinationURL,
   *  lihat shortlink_repository_impl.go), jadi searchTargets di config
   *  cuma satu target "search" yang dipetakan langsung ke situ. Tidak ada
   *  konsep Status di modul ini (bukan approval queue). */
  list(params: CmsListParams): Observable<Pagination<ShortLink>> {
    return this.shortlinkRepo.list({
      page: params.page, limit: params.limit, sort: params.sort,
      search: (params.filters['search'] ?? [])[0] ?? '',
      dateFrom: params.dateFrom, dateTo: params.dateTo,
    });
  }

  save(editId: number | null, form: ShortlinkFormValue): void {
    this.view.setSaving(true);
    const done = (message: string) => { this.toast.success(message); this.view.setSaving(false); this.view.onSaveSuccess(); };
    if (editId) {
      this.shortlinkRepo.update(editId, { destinationURL: form.destinationURL, shortKey: form.shortKey }).subscribe({
        next: () => done('Shortlink diperbarui'),
        error: () => this.view.setSaving(false),
      });
    } else {
      const body = form.shortKey ? form : { destinationURL: form.destinationURL };
      this.shortlinkRepo.create(body).subscribe({
        next: () => done('Shortlink dibuat'),
        error: () => this.view.setSaving(false),
      });
    }
  }

  remove(id: number): void {
    this.shortlinkRepo.remove(id).subscribe({
      next: () => { this.toast.success('Shortlink dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }

  bulkDelete(ids: number[]): void {
    this.shortlinkRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} shortlink terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
