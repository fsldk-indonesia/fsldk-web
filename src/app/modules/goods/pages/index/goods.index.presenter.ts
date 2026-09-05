import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { GoodsRepository } from '../../repositories/goods.repository';
import { GoodsCategoryRepository } from '../../repositories/goods-category.repository';
import { Goods } from '../../entities/goods';
import { GoodsIndexView } from './goods.index.view';

@Injectable()
export class GoodsIndexPresenter extends BasePresenter<GoodsIndexView> {
  private goodsRepo = inject(GoodsRepository);
  private categoryRepo = inject(GoodsCategoryRepository);
  private toast = inject(ToastService);

  loadCategories(): void {
    this.categoryRepo.cmsList().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
  }

  load(page: number, limit: number, search: string, categoryID: number, availability: string): void {
    this.goodsRepo.cmsList({ page, limit, search, categoryID: categoryID || undefined, availability: availability || undefined }).subscribe({
      next: (p) => this.view.setGoods(p.data, p.count), error: () => {},
    });
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
}
