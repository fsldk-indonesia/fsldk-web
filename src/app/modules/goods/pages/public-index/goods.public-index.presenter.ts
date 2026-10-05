import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { GoodsRepository } from '../../repositories/goods.repository';
import { GoodsPublicIndexView } from './goods.public-index.view';

export interface GoodsPublicFilter {
  categoryID: number;
  availability: string;
  /** Mem-filter `featured=1` ke backend (goods_dto.Filter.FeaturedOnly sudah
   *  didukung sejak awal, cuma belum pernah dipakai UI publik — lihat
   *  goods_handler_impl.go parseFilter). */
  featured: boolean;
}

export const emptyGoodsPublicFilter: GoodsPublicFilter = { categoryID: 0, availability: '', featured: false };

@Injectable()
export class GoodsPublicIndexPresenter extends BasePresenter<GoodsPublicIndexView> {
  private goodsRepo = inject(GoodsRepository);

  loadCategories(): void {
    this.goodsRepo.publicCategories().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
  }

  load(page: number, limit: number, search: string, sort: string, filter: GoodsPublicFilter): void {
    this.view.setLoading(true);
    const q: Record<string, unknown> = {
      page, limit, search, sort,
      categoryID: filter.categoryID || undefined,
      availability: filter.availability || undefined,
      featured: filter.featured ? 1 : undefined,
    };
    this.goodsRepo.publicList(q).subscribe({
      next: (p) => { this.view.setGoods(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
