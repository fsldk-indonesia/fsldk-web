import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { Goods } from '../../entities/goods';
import { GoodsCategory } from '../../entities/goods-category';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent } from '../../../../shared/select.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { GoodsIndexPresenter } from './goods.index.presenter';
import { GoodsIndexView } from './goods.index.view';

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Tersedia',
  out_of_stock: 'Stok Habis',
  coming_soon: 'Segera Hadir',
};

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Semua Ketersediaan' },
  { value: 'available', label: 'Tersedia' },
  { value: 'out_of_stock', label: 'Stok Habis' },
  { value: 'coming_soon', label: 'Segera Hadir' },
];

@Component({
  selector: 'app-goods-index-page',
  standalone: true,
  templateUrl: './goods.index.page.html',
  imports: [RouterLink, FormsModule, IconComponent, SelectComponent, PaginationComponent],
  providers: [GoodsIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; } .thumb { width: 40px; height: 40px; border-radius: var(--radius-xs); object-fit: cover; background: var(--color-bg-warm); }`],
})
export class GoodsIndexPage implements OnInit, GoodsIndexView {
  private presenter = inject(GoodsIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  goods = signal<Goods[]>([]);
  categories = signal<GoodsCategory[]>([]);
  loading = signal(true);
  search = '';
  categoryID = 0;
  availability = '';
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  busy = signal<ReadonlySet<number>>(new Set());
  readonly formatRupiah = formatRupiah;
  readonly availabilityLabels = AVAILABILITY_LABELS;
  readonly availabilityOptions = AVAILABILITY_OPTIONS;

  canCreate = this.auth.hasPermission('goods.create');
  canUpdate = this.auth.hasPermission('goods.update');
  canPublish = this.auth.hasPermission('goods.publish');
  canDelete = this.auth.hasPermission('goods.delete');

  categoryOptions = computed(() => [{ value: 0, label: 'Semua Kategori' }, ...this.categories().map((c) => ({ value: c.goodsCategoryID, label: c.categoryName }))]);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();
    this.load();
  }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.search, this.categoryID, this.availability); }
  apply(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  togglePublish(g: Goods): void { this.setBusy(g.goodsID); this.presenter.togglePublish(g); }
  toggleFeatured(g: Goods): void { this.setBusy(g.goodsID); this.presenter.toggleFeatured(g); }
  async remove(g: Goods, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus produk "${g.goodsName}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Produk', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(g.goodsID);
    this.presenter.remove(g);
  }

  setGoods(goods: Goods[], count: number): void { this.goods.set(goods); this.count.set(count); this.loading.set(false); }
  setCategories(categories: GoodsCategory[]): void { this.categories.set(categories); }
  onPublishToggleSuccess(): void { this.load(); }
  onFeaturedToggleSuccess(): void { this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
