import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { Goods } from '../../entities/goods';
import { GoodsCategory } from '../../entities/goods-category';
import { goodsPath } from '../../goods.path';
import { IconComponent } from '../../../../shared/icon.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { SearchFilterSortComponent, FilterFieldDef, SortOptionDef } from '../../../../shared/search-filter-sort.component';
import { GoodsPublicIndexPresenter, GoodsPublicFilter, emptyGoodsPublicFilter } from './goods.public-index.presenter';
import { GoodsPublicIndexView } from './goods.public-index.view';

const SORT_OPTIONS: SortOptionDef[] = [
  { value: 'newest', label: 'Terbaru', icon: 'clock' },
  { value: 'featured', label: 'Unggulan Dulu', icon: 'award' },
  { value: 'name', label: 'Nama A-Z', icon: 'chevrons-up-down' },
  { value: 'price_asc', label: 'Harga Terendah', icon: 'arrow-down' },
  { value: 'price_desc', label: 'Harga Tertinggi', icon: 'arrow-up' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Tersedia' },
  { value: 'out_of_stock', label: 'Stok Habis' },
  { value: 'coming_soon', label: 'Segera Hadir' },
];

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Tersedia',
  out_of_stock: 'Stok Habis',
  coming_soon: 'Segera Hadir',
};

/**
 * Halaman publik FSLDK Goods — hero reusable (shared/page-hero.component.ts) +
 * section hijau penuh tepi-ke-tepi, bahasa visual sama persis dengan Format
 * Keuangan/Perpustakaan/Berita. Kartu listing konsep "toko" (foto persegi
 * full-bleed + scrim hijau & nama produk muncul saat hover + strip thumbnail
 * galeri di sudut) — porting dari `.goods-card2` (kartu teaser Beranda, lihat
 * home.index.page.ts) ke grid utama, BUKAN sampul rasio 3/4 + tumpukan
 * halaman (Perpustakaan) atau tab folder + badge ikon bertumpuk (Format
 * Keuangan). Mobile: tile 2 kolom ringkas, tap membuka bottom sheet pratinjau
 * (foto + harga + status + deskripsi singkat) sebelum ke halaman detail penuh
 * — pola sama seperti Perpustakaan/Format Keuangan.
 */
@Component({
  selector: 'app-goods-public-index-page',
  standalone: true,
  templateUrl: './goods.public-index.page.html',
  imports: [RouterLink, IconComponent, PageHeroComponent, BottomSheetComponent, PaginationComponent, SearchFilterSortComponent],
  providers: [GoodsPublicIndexPresenter],
  styles: [`
    /* ---------- Siluet hero: tas belanja + label harga sebagai hub, garis
       jaringan menjalar ke titik-titik simpul — mekanisme identik
       Kalender/Perpustakaan/Format Keuangan, motif tengahnya diganti tas
       belanja + gantungan label harga, selaras tema FSLDK Goods. ---------- */
    .hero-gds-visual { position: relative; width: 100%; }
    .gds-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .gds-silhouette {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: gdsGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.2));
    }
    @keyframes gdsGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .gds-ground-shadow { fill: var(--color-primary-dark); opacity: .14; }
    @media (prefers-reduced-motion: reduce) { .gds-silhouette { animation: none; opacity: 1; transform: none; } }

    .gds-line { fill: none; stroke: var(--color-primary); stroke-width: 1.8; stroke-linecap: round; opacity: .55; }
    .gds-line.thick { stroke-width: 2.6; opacity: .75; stroke: var(--color-primary-bright); }
    .gds-tier { opacity: 0; animation: gdsTierFadeIn .4s ease-out forwards; }
    .gds-tier-0 { animation-delay: .75s; }
    .gds-tier-1 { animation-delay: 1.3s; }
    .gds-tier-2 { animation-delay: 1.8s; }
    @keyframes gdsTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .gds-badge {
      transform-box: fill-box; transform-origin: center; opacity: 0;
      animation: gdsBadgePop .5s cubic-bezier(.34,1.4,.64,1) 2.2s forwards;
    }
    @keyframes gdsBadgePop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .gds-tier, .gds-badge { animation: none; opacity: 1; transform: none; } }

    /* ---------- Section hijau PENUH tepi-ke-tepi + siluet ikon raksasa
       pudar — pola sama persis Format Keuangan/Perpustakaan/Berita. ---------- */
    .section { position: relative; overflow: hidden; background: var(--color-primary); padding: 56px 0 72px; }
    .gds-panel-silhouette { position: absolute; right: 8px; bottom: 8px; z-index: 0; color: rgba(255,255,255,.12); transform: rotate(-12deg); pointer-events: none; }
    .gds-panel-silhouette-2 { position: absolute; left: 8px; top: 8px; z-index: 0; color: rgba(255,255,255,.08); transform: rotate(16deg); pointer-events: none; }
    .section > .container { position: relative; z-index: 1; }

    .gds-section-head { margin-bottom: 28px; }
    .gds-section-head h2 { margin: 0 0 10px; color: #fff; }
    .gds-section-subtitle { max-width: 560px; margin: 0 auto; color: rgba(255,255,255,.85); font-size: 1.02rem; line-height: 1.6; }

    @media (max-width: 640px) { .section { padding: 40px 0 56px; } }

    /* ---------- Toolbar putih di atas hijau solid — pola override sama
       seperti Format Keuangan/Perpustakaan (tombol Filter default-nya hijau,
       invisible di atas section hijau tanpa override ini). ---------- */
    .gds-toolbar { max-width: 900px; margin: 0 auto 32px; }
    ::ng-deep .gds-toolbar .sfs-btn-filter { background: #fff !important; color: var(--color-primary-dark) !important; }
    ::ng-deep .gds-toolbar .sfs-btn-filter app-icon { color: var(--color-primary-dark) !important; }
    ::ng-deep .gds-toolbar .sfs-btn-filter:hover { background: var(--color-primary-soft) !important; }
    ::ng-deep .gds-toolbar .sfs-count { box-shadow: 0 0 0 2px var(--color-primary); }
    ::ng-deep .gds-toolbar .sfs-active-chip { background: #fff; color: var(--color-primary-dark); box-shadow: var(--shadow-sm); }
    ::ng-deep .gds-toolbar .sfs-active-chip button { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    ::ng-deep .gds-toolbar .sfs-active-chip button:hover { background: var(--color-primary); color: #fff; }

    .gds-panel-slab { background: #fff; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); max-width: 640px; margin: 0 auto; }
    .gds-empty-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 10px; }
    .gds-empty-actions .chip { display: inline-flex; align-items: center; gap: 6px; }

    /* ---------- Kartu "toko" (shop.app style) — konsep BEDA dari tab folder
       (Format Keuangan) atau sampul rasio 3/4 + tumpukan halaman
       (Perpustakaan): foto produk persegi full-bleed jadi hero kartu, nama
       produk + scrim hijau muncul di ATAS foto saat hover (bukan di bawah
       foto), strip galeri tambahan menumpuk di sudut kiri-bawah foto — ala
       shop.app, porting persis dari kartu teaser Beranda (.goods-card2). ---------- */
    .gds-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 26px; max-width: 1240px; margin: 0 auto; }
    @media (max-width: 992px) and (min-width: 901px) { .gds-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; } }

    .gds-card { display: flex; flex-direction: column; height: 100%; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .gds-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-5px); text-decoration: none; }
    .gds-card-media { position: relative; aspect-ratio: 1/1; background: var(--color-primary-soft); overflow: hidden; }
    .gds-card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
    @media (hover: hover) and (pointer: fine) { .gds-card:hover .gds-card-media img { transform: scale(1.06); } }
    .gds-card-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); }

    .gds-featured-ribbon {
      position: absolute; top: 14px; left: -32px; z-index: 2; transform: rotate(-45deg); background: var(--color-gold); color: #fff;
      font-size: .66rem; font-weight: 800; letter-spacing: .03em; padding: 4px 36px; box-shadow: var(--shadow-sm);
    }
    .gds-unavailable-badge {
      position: absolute; top: 10px; right: 10px; z-index: 2; background: rgba(22,33,28,.72); color: #fff;
      font-size: .7rem; font-weight: 700; padding: 4px 10px; border-radius: var(--radius-full);
    }
    /* Scrim hijau + nama produk — HOVER-ONLY (pointer halus), menutup
       seluruh foto supaya kontras teks putih terjamin di mana pun nama
       produk jatuh. */
    .gds-card-scrim {
      position: absolute; inset: 0; z-index: 1; pointer-events: none;
      background: linear-gradient(to top, rgba(4,55,26,.88) 0%, rgba(4,55,26,.5) 55%, rgba(4,55,26,.22) 100%);
      opacity: 0; transition: opacity var(--motion-base) ease;
    }
    @media (hover: hover) and (pointer: fine) { .gds-card:hover .gds-card-scrim { opacity: 1; } }
    .gds-card-name-overlay {
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, calc(-50% + 6px)); z-index: 2;
      max-width: calc(100% - 32px); padding: 0 16px; color: #fff; text-align: center;
      font-family: var(--font-heading); font-weight: 700; font-size: 1.05rem; line-height: 1.35;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
      opacity: 0; pointer-events: none;
      transition: opacity var(--motion-base) ease, transform var(--motion-base) var(--ease-out);
    }
    @media (hover: hover) and (pointer: fine) {
      .gds-card:hover .gds-card-name-overlay { opacity: 1; transform: translate(-50%, -50%); }
    }
    .gds-card-gallery { position: absolute; left: 10px; bottom: 10px; z-index: 3; display: flex; gap: 6px; }
    .gds-card-gallery-thumb {
      display: block; width: 44px; height: 44px; border-radius: 10px; overflow: hidden;
      border: 2.5px solid #fff; box-shadow: var(--shadow-sm); background: #fff;
    }
    .gds-card-gallery-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

    .gds-card-body { flex: 1; display: flex; flex-direction: column; padding: 16px; }
    .gds-card-body h3 { margin: 6px 0 4px; font-size: 1rem; line-height: 1.3; font-family: var(--font-heading); font-weight: 800; color: var(--color-text); }
    .gds-card-meta { display: flex; align-items: center; gap: 5px; font-size: .78rem; color: var(--color-muted); font-weight: 600; margin: 0; }
    .gds-card-price { display: block; margin-top: auto; padding-top: 10px; font-weight: 800; color: var(--color-primary-dark); font-size: 1.08rem; }

    .gds-card-skel { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }

    /* ---------- Mobile: tile ringkas 2 kolom -> tap buka bottom sheet. ---------- */
    .gds-tile-grid { display: none; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .gds-tile {
      position: relative; display: flex; flex-direction: column; text-align: left;
      background: #fff; border: none; border-radius: 16px; padding: 0; overflow: hidden; box-shadow: var(--shadow-sm);
      cursor: pointer; -webkit-tap-highlight-color: transparent;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .gds-tile:active { transform: scale(.97); }
    .gds-tile-media { position: relative; aspect-ratio: 1/1; background: var(--color-primary-soft); overflow: hidden; }
    .gds-tile-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .gds-tile-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); }
    .gds-tile-featured { position: absolute; top: 8px; left: 8px; z-index: 1; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--color-gold); color: #fff; box-shadow: var(--shadow-sm); }
    .gds-tile-unavailable { position: absolute; top: 8px; right: 8px; z-index: 1; background: rgba(22,33,28,.72); color: #fff; font-size: .62rem; font-weight: 700; padding: 3px 7px; border-radius: var(--radius-full); }
    .gds-tile-body { padding: 10px 12px 12px; }
    .gds-tile-body h4 { margin: 0 0 4px; font-size: .84rem; line-height: 1.3; font-weight: 700; color: var(--color-text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .gds-tile-price { display: block; font-weight: 800; color: var(--color-primary-dark); font-size: .9rem; }

    @media (max-width: 900px) { .gds-grid { display: none; } .gds-tile-grid { display: grid; } }

    .pagination-wrapper { margin-top: 48px; display: flex; justify-content: center; }
    ::ng-deep .pagination-wrapper .pgn-info { color: rgba(255,255,255,.8) !important; }
    ::ng-deep .pagination-wrapper .pgn-info strong { color: #fff !important; }

    /* ---------- Sheet mobile: pratinjau produk. ---------- */
    .gds-sheet-media { position: relative; margin: 0 0 14px; border-radius: 14px; overflow: hidden; aspect-ratio: 4/3; background: var(--color-primary-soft); }
    .gds-sheet-media img { display: block; width: 100%; height: 100%; object-fit: cover; }
    .gds-sheet-media-fallback { position: relative; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-primary); }
    .gds-sheet-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
    .gds-sheet-price { font-size: 1.3rem; font-weight: 800; color: var(--color-primary-dark); margin: 0 0 12px; }
    .gds-sheet-desc { font-size: .88rem; line-height: 1.7; color: var(--color-text-secondary); margin: 0; }
  `],
})
export class GoodsPublicIndexPage implements OnInit, AfterViewInit, OnDestroy, GoodsPublicIndexView {
  private presenter = inject(GoodsPublicIndexPresenter);
  private router = inject(Router);

  items = signal<Goods[]>([]);
  categories = signal<GoodsCategory[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 12;

  searchText = signal('');
  currentSort = signal('newest');
  filterValues = signal<Record<string, unknown>>({});
  readonly sortOptions = SORT_OPTIONS;
  readonly availabilityLabels = AVAILABILITY_LABELS;
  readonly formatRupiah = formatRupiah;
  readonly goodsPath = goodsPath;
  readonly skeletonItems = Array.from({ length: 8 }, (_, i) => i);

  filterFields = computed<FilterFieldDef[]>(() => {
    const fields: FilterFieldDef[] = [];
    if (this.categories().length) {
      fields.push({ key: 'categoryID', label: 'Kategori', icon: 'tags', options: this.categories().map((c) => ({ value: c.goodsCategoryID, label: c.categoryName })) });
    }
    fields.push({ key: 'availability', label: 'Ketersediaan', icon: 'check-circle', options: AVAILABILITY_OPTIONS });
    fields.push({ key: 'featured', label: 'Unggulan', icon: 'award', options: [{ value: 1, label: 'Hanya Produk Unggulan' }] });
    return fields;
  });

  /** Sheet mobile-only, tap tile produk. */
  sheetItem = signal<Goods | null>(null);

  @ViewChildren('gdsLine') private gdsLineRefs!: QueryList<ElementRef<SVGPathElement>>;

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();
    this.loadData();
    // Section di halaman ini berakhir hijau solid — ruang negatif wave
    // footer perlu diisi hijau khusus di sini, pola sama persis Format
    // Keuangan/Perpustakaan/Berita.
    document.documentElement.style.setProperty('--footer-wave-backdrop', 'var(--color-primary)');
  }

  ngAfterViewInit(): void {
    this.animateGdsLines();
  }

  ngOnDestroy(): void {
    document.documentElement.style.removeProperty('--footer-wave-backdrop');
  }

  private currentFilter(): GoodsPublicFilter {
    const v = this.filterValues();
    return {
      categoryID: (v['categoryID'] as number | undefined) ?? emptyGoodsPublicFilter.categoryID,
      availability: (v['availability'] as string | undefined) ?? emptyGoodsPublicFilter.availability,
      featured: !!v['featured'],
    };
  }

  loadData(page = this.page()): void {
    this.page.set(page);
    this.presenter.load(page, this.limit, this.searchText(), this.currentSort(), this.currentFilter());
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.loadData(1);
  }

  onFilterApply(values: Record<string, unknown>): void {
    this.filterValues.set(values);
    this.loadData(1);
  }

  onSortChange(sort: string): void {
    if (this.currentSort() === sort) return;
    this.currentSort.set(sort);
    this.loadData(1);
  }

  activeFilterCount(): number {
    return Object.values(this.filterValues()).reduce((sum: number, v) => (v !== null && v !== undefined && v !== '' ? sum + 1 : sum), 0);
  }

  hasActiveSearchOrFilter(): boolean {
    return !!this.searchText() || this.activeFilterCount() > 0;
  }

  resetSearchAndFilter(): void {
    this.searchText.set('');
    this.filterValues.set({});
    this.loadData(1);
  }

  onPageChange(newPage: number): void {
    this.loadData(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openSheet(item: Goods): void { this.sheetItem.set(item); }
  closeSheet(): void { this.sheetItem.set(null); }

  goToSheetDetail(): void {
    const item = this.sheetItem();
    if (!item) return;
    this.router.navigate([goodsPath.publicDetail(item.goodsSlug)]);
  }

  /** Efek "jaringan digambar sendiri" — identik animateFmtLines()/
   *  animateBookLines() di hero Format Keuangan/Perpustakaan. */
  private animateGdsLines(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.gdsLineRefs?.forEach((ref, i) => {
      const path = ref.nativeElement;
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      if (reduced) { path.style.strokeDashoffset = '0'; return; }
      path.animate(
        [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
        { duration: 600, delay: 700 + i * 130, easing: 'ease-out', fill: 'forwards' },
      );
    });
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setGoods(goods: Goods[], count: number): void { this.items.set(goods); this.count.set(count); }
  setCategories(categories: GoodsCategory[]): void { this.categories.set(categories); }
}
