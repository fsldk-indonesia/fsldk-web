import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { GoodsRepository } from '../../repositories/goods.repository';
import { GoodsCategoryRepository } from '../../repositories/goods-category.repository';
import { Goods } from '../../entities/goods';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsComboboxOption, CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { GoodsIndexView } from './goods.index.view';

const AVAILABILITY_OPTIONS: CmsComboboxOption[] = [
  { id: 'available', label: 'Tersedia' },
  { id: 'out_of_stock', label: 'Stok Habis' },
  { id: 'coming_soon', label: 'Segera Hadir' },
];

@Injectable()
export class GoodsIndexPresenter extends BasePresenter<GoodsIndexView> {
  private goodsRepo = inject(GoodsRepository);
  private categoryRepo = inject(GoodsCategoryRepository);
  private toast = inject(ToastService);

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param goods_dto.Filter. Status Published/Draft (isPublished)
   *  MUTUALLY EXCLUSIVE di backend (kolom boolean, bukan array) — sama pola
   *  isRead di Pesan Kontak. Ketersediaan & Kategori bukan bagian dari
   *  statusOptions (keduanya dimensi enum/lookup, bukan lifecycle status),
   *  jadi ditaruh sebagai target pencarian mode combobox. */
  list(params: CmsListParams): Observable<Pagination<Goods>> {
    const isPublished = params.status.length === 1 ? (params.status[0] === 'published' ? 'true' : 'false') : '';
    return this.goodsRepo.cmsList({
      page: params.page, limit: params.limit, sort: params.sort,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['name'] ?? [])[0] ?? '',
      categoryID: (params.filters['category'] ?? [])[0] ?? '',
      availability: (params.filters['availability'] ?? [])[0] ?? '',
      isPublished,
    });
  }

  /** loadOptions untuk target-pencarian "Kategori" (mode combobox). */
  categoryOptions(): Observable<CmsComboboxOption[]> {
    return this.categoryRepo.cmsList({ limit: 200 }).pipe(map((p) => p.data.map((c) => ({ id: c.goodsCategoryID, label: c.categoryName }))));
  }

  /** loadOptions untuk target-pencarian "Ketersediaan" (mode combobox, nilai tetap). */
  availabilityOptions(): Observable<CmsComboboxOption[]> {
    return of(AVAILABILITY_OPTIONS);
  }

  togglePublish(g: Goods): void {
    this.goodsRepo.publish(g.goodsID, !g.isPublished).subscribe({
      next: () => { this.toast.success(g.isPublished ? 'Publikasi ditarik' : 'Produk dipublikasikan'); this.view.onPublishToggleSuccess(); this.view.onActionSettled(g.goodsID); },
      error: () => this.view.onActionSettled(g.goodsID),
    });
  }

  toggleFeatured(g: Goods): void {
    this.goodsRepo.featuredToggle(g.goodsID, !g.isFeatured).subscribe({
      next: () => { this.toast.success(g.isFeatured ? 'Produk dilepas dari unggulan' : 'Produk dijadikan unggulan'); this.view.onFeaturedToggleSuccess(); this.view.onActionSettled(g.goodsID); },
      error: () => this.view.onActionSettled(g.goodsID),
    });
  }

  remove(g: Goods): void {
    this.goodsRepo.remove(g.goodsID).subscribe({
      next: () => { this.toast.success('Produk dihapus'); this.view.onRemoveSuccess(); this.view.onActionSettled(g.goodsID); },
      error: () => this.view.onActionSettled(g.goodsID),
    });
  }

  bulkDelete(ids: number[]): void {
    this.goodsRepo.bulkDelete(ids).subscribe({
      next: () => { this.toast.success(`${ids.length} produk terpilih dihapus`); this.view.onBulkDeleteSuccess(); },
      error: () => {},
    });
  }
}
