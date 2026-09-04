import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { GoodsRepository } from '../../repositories/goods.repository';
import { GoodsPublicDetailView } from './goods.public-detail.view';

@Injectable()
export class GoodsPublicDetailPresenter extends BasePresenter<GoodsPublicDetailView> {
  private goodsRepo = inject(GoodsRepository);

  load(slug: string): void {
    this.view.setLoading(true);
    this.goodsRepo.publicDetail(slug).subscribe({
      next: (g) => { this.view.setGoods(g); this.view.setLoading(false); },
      error: () => { this.view.setGoods(null); this.view.setLoading(false); },
    });
  }
}
