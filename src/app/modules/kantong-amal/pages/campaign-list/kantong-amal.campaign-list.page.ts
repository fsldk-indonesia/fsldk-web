import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Campaign, CampaignCategory } from '../../entities/campaign';
import { IconComponent } from '../../../../shared/icon.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { SearchFilterSortComponent, FilterFieldDef, SortOptionDef } from '../../../../shared/search-filter-sort.component';
import { formatRupiah } from '../../../../core/utils/format-rupiah';
import { kantongAmalPath } from '../../kantong-amal.path';
import { KantongAmalCampaignListPresenter } from './kantong-amal.campaign-list.presenter';
import { KantongAmalCampaignListView } from './kantong-amal.campaign-list.view';

const SORT_OPTIONS: SortOptionDef[] = [
  { value: '-createdDate', label: 'Terbaru', icon: 'clock' },
  { value: 'createdDate', label: 'Terlama', icon: 'rotate-ccw' },
  { value: '-collectedAmountCache', label: 'Dana Terkumpul Terbanyak', icon: 'arrow-up' },
  { value: '-targetAmount', label: 'Target Tertinggi', icon: 'award' },
  { value: 'title', label: 'Nama A-Z', icon: 'chevrons-up-down' },
];

/**
 * Halaman publik listing Kantong Amal — hero reusable (shared/page-hero.component.ts) +
 * background `.section-blob-drift` PERSIS sama dengan Galeri (tint hijau +
 * blob drift animasi), BUKAN section hijau solid ala Goods. Toolbar cari/
 * filter/urutkan pakai komponen global (shared/search-filter-sort.component.ts)
 * dengan [filterMobileSheet]="true" — filter kategori jadi bottom sheet native
 * di mobile. Kartu listing konsep "progres donasi" — foto di atas + body putih
 * berisi kategori/judul/organisasi/progress bar/CTA, BEDA dari kartu editorial
 * overlay-foto Galeri maupun kartu toko hover-reveal Goods. Mobile: tile 2
 * kolom, tap membuka bottom sheet pratinjau sebelum ke halaman detail penuh —
 * pola sama seperti Galeri/Goods.
 */
@Component({
  selector: 'app-kantong-amal-campaign-list-page',
  standalone: true,
  templateUrl: './kantong-amal.campaign-list.page.html',
  imports: [RouterLink, IconComponent, PageHeroComponent, BottomSheetComponent, PaginationComponent, SearchFilterSortComponent],
  providers: [KantongAmalCampaignListPresenter],
  styles: [`
    /* ---------- Siluet hero: hati dalam dekapan tangan sebagai hub, garis
       jaringan menjalar ke titik-titik simpul — mekanisme identik Goods/
       Kalender/Perpustakaan, motif tengahnya diganti hati+tangan, selaras
       tema Kantong Amal (donasi/kepedulian). ---------- */
    .hero-kam-visual { position: relative; width: 100%; }
    .kam-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .kam-silhouette {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: kamGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.2));
    }
    @keyframes kamGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @media (prefers-reduced-motion: reduce) { .kam-silhouette { animation: none; opacity: 1; transform: none; } }

    .kam-heartbeat { transform-box: fill-box; transform-origin: center; animation: kamHeartbeat 1.8s ease-in-out 1s infinite; }
    @keyframes kamHeartbeat { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.12); } 30% { transform: scale(1); } 45% { transform: scale(1.08); } 60% { transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .kam-heartbeat { animation: none; } }

    .kam-line { fill: none; stroke: var(--color-primary); stroke-width: 1.8; stroke-linecap: round; opacity: .55; }
    .kam-line.thick { stroke-width: 2.6; opacity: .75; stroke: var(--color-primary-bright); }
    .kam-tier { opacity: 0; animation: kamTierFadeIn .4s ease-out forwards; }
    .kam-tier-0 { animation-delay: .75s; }
    .kam-tier-1 { animation-delay: 1.3s; }
    @keyframes kamTierFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .kam-tier { animation: none; opacity: 1; } }

    /* =====================================================================
       Kanvas setelah hero — DISALIN PERSIS dari Galeri (.section +
       .section-transition + .section-blob-drift). ===================================================================== */
    .section { background: var(--color-primary-tint); position: relative; min-height: 60vh; }
    .section-transition { position: relative; padding-top: 32px; }
    .section-blob-drift { overflow: hidden; }
    .section-blob-drift > .container { position: relative; z-index: 1; }
    .section-blob-drift::before {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(ellipse 55% 55% at 88% 42%, var(--color-gold-soft) 0%, var(--color-primary-soft) 42%, transparent 75%),
        radial-gradient(ellipse 50% 50% at 10% 62%, var(--color-primary-soft) 0%, var(--color-gold-soft) 45%, transparent 75%);
      opacity: .8; animation: sectionBlobDrift 12s ease-in-out infinite alternate;
    }
    .section-blob-drift::after {
      content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none;
      background: linear-gradient(to bottom,
        var(--color-primary-tint) 0, transparent 70px,
        transparent calc(100% - 70px), var(--color-primary-tint) 100%);
    }
    @keyframes sectionBlobDrift {
      from { transform: translate(0, 0) scale(1); }
      to { transform: translate(-4%, 5%) scale(1.15); }
    }
    @media (prefers-reduced-motion: reduce) { .section-blob-drift::before { animation: none; } }

    .kam-section-head { margin-bottom: 28px; }
    .kam-section-head h2 { margin: 14px 0 10px; }
    .kam-section-subtitle { max-width: 560px; margin: 0 auto; color: var(--color-text-secondary); font-size: 1.02rem; line-height: 1.6; }
    .kam-toolbar { max-width: 900px; margin: 0 auto 40px; }

    .kam-empty-suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 6px; }
    .kam-empty-suggestions .chip { display: inline-flex; align-items: center; gap: 6px; }
    .kam-empty-anim { animation: kamEmptyFadeIn .5s var(--ease-out) both; }
    @keyframes kamEmptyFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
    .kam-empty-icon {
      position: relative; display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px;
      border-radius: 50%; margin: 0 auto 14px; color: #fff;
      background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary));
      box-shadow: 0 10px 24px color-mix(in srgb, var(--color-primary) 30%, transparent);
      animation: kamEmptyIconPop .5s var(--ease-out) .1s both, kamEmptyIconFloat 3.2s ease-in-out .6s infinite;
    }
    @keyframes kamEmptyIconPop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: scale(1); } }
    @keyframes kamEmptyIconFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @media (prefers-reduced-motion: reduce) { .kam-empty-anim, .kam-empty-icon { animation: none; opacity: 1; transform: none; } }

    /* ---------- Kartu "progres donasi" — konsep BEDA dari kartu editorial
       overlay-foto Galeri (scrim+judul di atas foto) atau kartu toko
       hover-reveal Goods (nama muncul saat hover): foto persegi-panjang di
       ATAS sebagai banner (bukan overlay), body putih di bawahnya memuat
       kategori + judul + organisasi + progress bar donasi + CTA permanen —
       progress bar jadi elemen utama yang membedakan kartu ini (urgensi
       donasi), bukan sekadar harga/tanggal. ---------- */
    .kam-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; max-width: 1200px; margin: 0 auto; }
    @media (max-width: 992px) { .kam-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } }

    .kam-card {
      display: flex; flex-direction: column; height: 100%; background: #fff; border-radius: 20px; overflow: hidden;
      box-shadow: var(--shadow-sm); text-decoration: none; position: relative;
      transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out);
    }
    .kam-card:hover { box-shadow: 0 30px 56px rgba(0,60,25,.22); transform: translateY(-8px); text-decoration: none; }

    .kam-card-media { position: relative; aspect-ratio: 16/10; overflow: hidden; background: var(--color-primary-soft); }
    .kam-card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s cubic-bezier(.22,1,.36,1); }
    @media (hover: hover) and (pointer: fine) { .kam-card:hover .kam-card-media img { transform: scale(1.08); } }
    .kam-card-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); }
    .kam-card-category {
      position: absolute; top: 14px; left: 14px; z-index: 2;
      display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: var(--radius-full);
      background: rgba(255,255,255,.94); backdrop-filter: blur(6px); color: var(--color-primary-dark);
      font-size: .7rem; font-weight: 800; letter-spacing: .02em; box-shadow: var(--shadow-sm);
    }
    /* Pita persentase tercapai — sudut kanan-atas foto, gaya "donation meter"
       yang tidak ada di kartu Galeri/Goods. */
    .kam-card-percent {
      position: absolute; top: 14px; right: 14px; z-index: 2;
      display: inline-flex; align-items: baseline; gap: 2px; padding: 5px 11px; border-radius: var(--radius-full);
      background: var(--color-primary-dark); color: #fff; font-weight: 800; font-size: .76rem; box-shadow: var(--shadow-sm);
    }
    .kam-card-percent small { font-weight: 700; font-size: .62rem; opacity: .85; }

    .kam-card-body { flex: 1; display: flex; flex-direction: column; padding: 18px 18px 20px; }
    .kam-card-org { display: flex; align-items: center; gap: 6px; font-size: .76rem; font-weight: 700; color: var(--color-muted); margin-bottom: 6px; }
    .kam-card-org app-icon { color: var(--color-primary); flex-shrink: 0; }
    .kam-card-title {
      margin: 0 0 14px; font-family: var(--font-heading); font-weight: 800; font-size: 1.04rem; line-height: 1.35; color: var(--color-text);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.7em;
    }

    .kam-progress-track { height: 9px; border-radius: 999px; background: var(--color-bg-alt); overflow: hidden; }
    .kam-progress-fill {
      height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--color-primary-bright), var(--color-primary));
      transform-origin: left center; transform: scaleX(0); animation: kamFillIn 1s var(--ease-out) .15s forwards;
    }
    @keyframes kamFillIn { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @media (prefers-reduced-motion: reduce) { .kam-progress-fill { animation: none; transform: none; } }

    .kam-progress-meta { display: flex; justify-content: space-between; align-items: baseline; font-size: .8rem; color: var(--color-text-secondary); margin-top: 9px; }
    .kam-progress-meta strong { display: block; color: var(--color-primary-dark); font-size: .98rem; font-weight: 800; }

    .kam-card-cta {
      margin-top: 16px; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
      padding: 11px; border-radius: var(--radius-full); border: 1.5px solid var(--color-primary);
      color: var(--color-primary-dark); font-weight: 700; font-size: .86rem;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    @media (hover: hover) and (pointer: fine) {
      .kam-card:hover .kam-card-cta { background: var(--color-primary); color: #fff; transform: translateY(-1px); }
    }

    .kam-card-skel { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-sm); }

    /* ---------- Mobile: daftar kartu horizontal (thumb kiri + info kanan)
       ditumpuk vertikal — bentuk PERSIS sama dengan teaser Kantong Amal di
       Beranda (.campaign-card2 breakpoint <=640px, home.index.page.ts),
       disalin ulang di sini karena view encapsulation. Tap buka bottom
       sheet (bukan navigasi langsung seperti Beranda non-preview). ---------- */
    .kam-tile-grid { display: none; flex-direction: column; gap: 14px; }
    .kam-tile {
      position: relative; display: flex; flex-direction: row; text-align: left; height: auto;
      background: #fff; border: none; border-radius: var(--radius-lg); padding: 0; overflow: hidden; box-shadow: var(--shadow-sm);
      cursor: pointer; -webkit-tap-highlight-color: transparent;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .kam-tile:active { transform: scale(.98); }
    .kam-tile-media { position: relative; width: 112px; flex-shrink: 0; background: var(--color-primary-soft); overflow: hidden; }
    .kam-tile-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .kam-tile-media-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--color-primary); }
    .kam-tile-category {
      position: absolute; left: 8px; top: 8px; z-index: 1;
      background: var(--color-primary-soft); color: var(--color-primary-dark); font-size: .62rem; font-weight: 800;
      padding: 3px 8px; border-radius: var(--radius-full);
    }
    .kam-tile-badge {
      position: absolute; right: 8px; top: 8px; z-index: 1; background: var(--color-gold); color: var(--color-gold-dark, #5c4400);
      font-size: .58rem; font-weight: 800; padding: 3px 7px; border-radius: var(--radius-full); box-shadow: var(--shadow-sm);
    }
    .kam-tile-body { flex: 1; min-width: 0; padding: 10px 14px; display: flex; flex-direction: column; }
    .kam-tile-body h4 { margin: 0; font-size: .88rem; line-height: 1.3; font-weight: 700; color: var(--color-text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .kam-tile-track { height: 6px; border-radius: 999px; background: var(--color-bg-alt); overflow: hidden; margin-top: 8px; }
    .kam-tile-fill { height: 100%; border-radius: 999px; background: var(--color-primary); }
    .kam-tile-percent-label { display: block; margin-top: 4px; font-size: .72rem; font-weight: 700; color: var(--color-primary-dark); }
    .kam-tile-amounts { display: flex; margin-top: 6px; }
    .kam-tile-amount { display: flex; flex-direction: column; gap: 1px; }
    .kam-tile-amount strong { font-size: .84rem; color: var(--color-text); }
    .kam-tile-amount small { font-size: .68rem; color: var(--color-muted); }

    @media (max-width: 900px) { .kam-grid { display: none; } .kam-tile-grid { display: flex; } }

    .pagination-wrapper { margin-top: 48px; display: flex; justify-content: center; }

    /* ---------- Sheet mobile: pratinjau campaign. ---------- */
    .kam-sheet-media { position: relative; margin: 0 0 14px; border-radius: 14px; overflow: hidden; aspect-ratio: 16/10; background: var(--color-primary-soft); }
    .kam-sheet-media img { display: block; width: 100%; height: 100%; object-fit: cover; }
    .kam-sheet-media-fallback { position: relative; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--color-primary); }
    .kam-sheet-org { display: flex; align-items: center; gap: 6px; font-size: .8rem; font-weight: 700; color: var(--color-muted); margin: 0 0 6px; }
    .kam-sheet-org app-icon { color: var(--color-primary); }
  `],
})
export class KantongAmalCampaignListPage implements OnInit, KantongAmalCampaignListView {
  private presenter = inject(KantongAmalCampaignListPresenter);
  private router = inject(Router);

  campaigns = signal<Campaign[]>([]);
  categories = signal<CampaignCategory[]>([]);
  provinces = signal<string[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  limit = 9;

  searchText = signal('');
  currentSort = signal('-createdDate');
  filterValues = signal<Record<string, unknown>>({});

  readonly sortOptions = SORT_OPTIONS;
  readonly kantongAmalPath = kantongAmalPath;
  readonly formatRupiah = formatRupiah;
  readonly skeletonItems = Array.from({ length: 6 }, (_, i) => i);

  filterFields = computed<FilterFieldDef[]>(() => {
    const fields: FilterFieldDef[] = [];
    if (this.categories().length) {
      fields.push({ key: 'categoryID', label: 'Kategori', icon: 'tags', options: this.categories().map((c) => ({ value: c.campaignCategoryID, label: c.categoryName })) });
    }
    if (this.provinces().length) {
      fields.push({ key: 'province', label: 'Provinsi', icon: 'map-pin', options: this.provinces().map((p) => ({ value: p, label: p })) });
    }
    fields.push({ key: 'featured', label: 'Unggulan', icon: 'award', options: [{ value: 1, label: 'Hanya Campaign Unggulan' }] });
    return fields;
  });

  /** Sheet mobile-only, tap tile campaign. */
  sheetItem = signal<Campaign | null>(null);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.loadCategories();
    this.presenter.loadProvinces();
    this.loadData();
  }

  private currentCategoryID(): number {
    return (this.filterValues()['categoryID'] as number | undefined) ?? 0;
  }

  private currentProvince(): string | undefined {
    return this.filterValues()['province'] as string | undefined;
  }

  private currentFeatured(): boolean {
    return !!this.filterValues()['featured'];
  }

  loadData(page = this.page()): void {
    this.page.set(page);
    this.presenter.load(page, this.limit, this.searchText(), this.currentCategoryID(), this.currentSort(), this.currentProvince(), this.currentFeatured());
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

  progressPercent(c: Campaign): number {
    return c.targetAmount > 0 ? Math.min(100, Math.round((c.collectedAmount / c.targetAmount) * 100)) : 0;
  }

  organizationLabel(c: Campaign): string {
    return c.organizationNameOverride || c.organizationName || c.picName;
  }

  openSheet(item: Campaign): void { this.sheetItem.set(item); }
  closeSheet(): void { this.sheetItem.set(null); }

  goToSheetDetail(): void {
    const item = this.sheetItem();
    if (!item) return;
    this.router.navigate([kantongAmalPath.detail(item.slug)]);
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setCampaigns(campaigns: Campaign[], count: number): void { this.campaigns.set(campaigns); this.count.set(count); }
  setCategories(categories: CampaignCategory[]): void { this.categories.set(categories); }
  setProvinces(provinces: string[]): void { this.provinces.set(provinces); }
}
