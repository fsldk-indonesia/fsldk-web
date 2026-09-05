import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { Goods } from '../../entities/goods';
import { GoodsCategory } from '../../entities/goods-category';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent } from '../../../../shared/select.component';
import { GoodsPublicIndexPresenter, GoodsPublicFilter, emptyGoodsPublicFilter } from './goods.public-index.presenter';
import { GoodsPublicIndexView } from './goods.public-index.view';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'featured', label: 'Unggulan' },
  { value: 'name', label: 'Nama A-Z' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Semua Ketersediaan' },
  { value: 'available', label: 'Tersedia' },
  { value: 'out_of_stock', label: 'Stok Habis' },
  { value: 'coming_soon', label: 'Segera Hadir' },
];

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Tersedia',
  out_of_stock: 'Stok Habis',
  coming_soon: 'Segera Hadir',
};

@Component({
  selector: 'app-goods-public-index-page',
  standalone: true,
  templateUrl: './goods.public-index.page.html',
  imports: [RouterLink, FormsModule, IconComponent, SelectComponent],
  providers: [GoodsPublicIndexPresenter],
  styles: [`
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 220px, #fff 520px); }
    .toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; }
    .search { max-width: 340px; flex: 1 1 240px; }
    .filter-select { width: 190px; flex-shrink: 0; }
    .sort { width: 170px; flex-shrink: 0; }
    .goods-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .goods-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .goods-thumb { position: relative; aspect-ratio: 1/1; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-muted); }
    .goods-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .goods-featured-badge { position: absolute; top: 10px; left: 10px; display: inline-flex; align-items: center; gap: 4px; background: #fff; color: var(--color-primary-dark); font-size: .72rem; font-weight: 700; padding: 3px 9px; border-radius: 999px; box-shadow: var(--shadow); }
    .goods-body { padding: 16px; } .goods-body h3 { margin: 6px 0 4px; font-size: 1rem; line-height: 1.3; }
    .goods-price { font-weight: 700; color: var(--color-primary-dark); margin: 6px 0 0; }
    .pager { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 36px; color: var(--color-text-secondary); font-size: .9rem; }
  `],
})
export class GoodsPublicIndexPage implements OnInit, GoodsPublicIndexView {
  private presenter = inject(GoodsPublicIndexPresenter);

  items = signal<Goods[]>([]);
  categories = signal<GoodsCategory[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 12;
  search = '';
  sort = 'newest';
  filter: GoodsPublicFilter = { ...emptyGoodsPublicFilter };
  sortOptions = SORT_OPTIONS;
  availabilityOptions = AVAILABILITY_OPTIONS;
  readonly availabilityLabels = AVAILABILITY_LABELS;
  readonly formatRupiah = formatRupiah;
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;

  categoryOptions = computed(() => [{ value: 0, label: 'Semua Kategori' }, ...this.categories().map((c) => ({ value: c.goodsCategoryID, label: c.categoryName }))]);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();
    this.load();
  }

  load(): void { this.presenter.load(this.page(), this.limit, this.search, this.sort, this.filter); }
  apply(): void {
    if (this.debounceHandle) { clearTimeout(this.debounceHandle); this.debounceHandle = null; }
    this.page.set(1);
    this.load();
  }
  onSearchInput(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => this.apply(), 400);
  }
  go(p: number): void { this.page.set(p); this.load(); }
  totalPages(): number { return Math.max(1, Math.ceil(this.count() / this.limit)); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setGoods(goods: Goods[], count: number): void { this.items.set(goods); this.count.set(count); }
  setCategories(categories: GoodsCategory[]): void { this.categories.set(categories); }
}
