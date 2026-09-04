import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { GoodsCategory } from '../../entities/goods-category';
import { IconComponent } from '../../../../shared/icon.component';
import { GoodsCategoryIndexPresenter } from './goods-category.index.presenter';
import { GoodsCategoryIndexView } from './goods-category.index.view';

@Component({
  selector: 'app-goods-category-index-page',
  standalone: true,
  templateUrl: './goods-category.index.page.html',
  imports: [RouterLink, IconComponent],
  providers: [GoodsCategoryIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class GoodsCategoryIndexPage implements OnInit, GoodsCategoryIndexView {
  private presenter = inject(GoodsCategoryIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  categories = signal<GoodsCategory[]>([]);
  loading = signal(true);
  busy = signal<ReadonlySet<number>>(new Set());

  canCreate = this.auth.hasPermission('goodscategory.create');
  canUpdate = this.auth.hasPermission('goodscategory.update');
  canDelete = this.auth.hasPermission('goodscategory.delete');

  ngOnInit(): void { this.presenter.attachView(this); this.load(); }

  load(): void { this.loading.set(true); this.presenter.load(); }
  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  toggleActive(cat: GoodsCategory): void { this.setBusy(cat.goodsCategoryID); this.presenter.toggleActive(cat); }
  async remove(cat: GoodsCategory, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus kategori "${cat.categoryName}"? Kategori yang masih dipakai produk tidak dapat dihapus.`, {
      title: 'Hapus Kategori', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(cat.goodsCategoryID);
    this.presenter.remove(cat);
  }

  setCategories(categories: GoodsCategory[]): void { this.categories.set(categories); this.loading.set(false); }
  onToggleSuccess(): void { this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
