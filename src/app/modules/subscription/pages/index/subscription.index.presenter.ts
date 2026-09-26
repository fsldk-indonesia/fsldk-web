import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { SubscriptionRepository } from '../../repositories/subscription.repository';
import { Subscriber } from '../../entities/subscriber';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { SubscriptionIndexView } from './subscription.index.view';

@Injectable()
export class SubscriptionIndexPresenter extends BasePresenter<SubscriptionIndexView> {
  private subRepo = inject(SubscriptionRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param dto.ListQuery (search/sort langsung dipakai apa adanya,
   *  backend sudah pakai dto.ParseListQuery, lihat subscription_handler_impl.go)
   *  ditambah isActive/from/to. Status Aktif/Nonaktif MUTUALLY EXCLUSIVE di
   *  backend (satu kolom boolean, bukan array) — sama seperti pola isRead di
   *  Pesan Kontak: kalau kedua/tidak ada yang dicentang, isActive dikirim
   *  kosong (semua status). Rentang tanggal memfilter subscribedDate. */
  list(params: CmsListParams): Observable<Pagination<Subscriber>> {
    const isActive = params.status.length === 1 ? (params.status[0] === 'active' ? 'true' : 'false') : '';
    return this.subRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      search: (params.filters['search'] ?? [])[0] ?? '',
      isActive, from: params.dateFrom, to: params.dateTo,
    });
  }

  bulkAdd(emails: string): void {
    this.view.setAdding(true);
    this.subRepo.bulkAdd(emails).subscribe({
      next: (result) => { this.view.setAdding(false); this.view.onBulkAddResult(result); },
      error: () => this.view.setAdding(false),
    });
  }

  update(id: number, email: string, isActive: boolean): void {
    this.view.setSaving(true);
    this.subRepo.update(id, { email, isActive }).subscribe({
      next: () => { this.toast.success('Subscriber berhasil diperbarui'); this.view.setSaving(false); this.view.onUpdateSuccess(); },
      error: () => this.view.setSaving(false),
    });
  }

  remove(id: number): void {
    this.subRepo.remove(id).subscribe({
      next: () => { this.toast.success('Subscriber berhasil dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(id); },
      error: () => this.view.onActionSettled(id),
    });
  }

  bulkDelete(ids: number[]): void {
    this.subRepo.bulkRemove(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} subscriber terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
