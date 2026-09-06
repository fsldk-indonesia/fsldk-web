import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { GoodsCategoryRepository } from '../../repositories/goods-category.repository';
import { GoodsCategory } from '../../entities/goods-category';
import { GoodsCategoryIndexView } from './goods-category.index.view';

@Injectable()
export class GoodsCategoryIndexPresenter extends BasePresenter<GoodsCategoryIndexView> {
  private categoryRepo = inject(GoodsCategoryRepository);
  private toast = inject(ToastService);

  load(): void {
    this.categoryRepo.cmsList().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
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
}
