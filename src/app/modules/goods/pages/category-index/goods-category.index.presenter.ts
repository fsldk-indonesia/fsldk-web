import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { GoodsCategoryRepository } from '../../repositories/goods-category.repository';
import { GoodsCategory } from '../../entities/goods-category';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { GoodsCategoryIndexView } from './goods-category.index.view';

@Injectable()
export class GoodsCategoryIndexPresenter extends BasePresenter<GoodsCategoryIndexView> {
  private categoryRepo = inject(GoodsCategoryRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param dto.ListQuery (search/sort langsung dipakai apa adanya,
   *  backend sudah pakai dto.ParseListQuery, lihat goods_handler_impl.go).
   *  Status Aktif/Nonaktif MUTUALLY EXCLUSIVE (kolom boolean) — sama pola
   *  isRead/isActive di Pesan Kontak/Subscription. */
  list(params: CmsListParams): Observable<Pagination<GoodsCategory>> {
    const isActive = params.status.length === 1 ? (params.status[0] === 'active' ? 'true' : 'false') : '';
    return this.categoryRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      search: (params.filters['search'] ?? [])[0] ?? '',
      isActive,
    });
  }

  toggleActive(cat: GoodsCategory): void {
    const body = { categoryName: cat.categoryName, isActive: !cat.isActive, sortOrder: cat.sortOrder };
    this.categoryRepo.update(cat.goodsCategoryID, body).subscribe({
      next: () => { this.toast.success(cat.isActive ? 'Kategori dinonaktifkan' : 'Kategori diaktifkan'); this.view.onToggleSuccess(); this.view.onActionSettled(cat.goodsCategoryID); },
      error: () => this.view.onActionSettled(cat.goodsCategoryID),
    });
  }

  remove(cat: GoodsCategory): void {
    this.categoryRepo.remove(cat.goodsCategoryID).subscribe({
      next: () => { this.toast.success('Kategori dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(cat.goodsCategoryID); },
      error: () => this.view.onActionSettled(cat.goodsCategoryID),
    });
  }

  bulkDelete(ids: number[]): void {
    this.categoryRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} kategori terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
