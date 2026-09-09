import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { News } from '../../entities/news';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { SelectComponent, SelectOption } from '../../../../shared/select.component';
import { DateRangePickerComponent, DateRange } from '../../../../shared/date-range-picker.component';
import { NewsIndexPresenter } from './news.index.presenter';
import { NewsIndexView } from './news.index.view';

type SortColumn = 'newsTitle' | 'newsReporter' | 'categoryName' | 'isPublished' | 'createdDate';
type SortDir = 'asc' | 'desc';
type SearchTarget = 'title' | 'reporter' | 'category';

interface ColumnDef { key: SortColumn; label: string; locked: boolean; }

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Status' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

const SEARCH_TARGET_OPTIONS: SelectOption[] = [
  { value: 'title', label: 'Judul' },
  { value: 'reporter', label: 'Reporter' },
  { value: 'category', label: 'Kategori' },
];

const COLUMN_DEFS: ColumnDef[] = [
  { key: 'newsTitle', label: 'Judul', locked: true },
  { key: 'newsReporter', label: 'Reporter', locked: false },
  { key: 'categoryName', label: 'Kategori', locked: false },
  { key: 'isPublished', label: 'Status', locked: false },
  { key: 'createdDate', label: 'Tanggal', locked: false },
];

const DEFAULT_SORT_BY: SortColumn = 'createdDate';
const DEFAULT_SORT_DIR: SortDir = 'desc';

@Component({
  selector: 'app-news-index-page',
  standalone: true,
  templateUrl: './news.index.page.html',
  imports: [RouterLink, DatePipe, FormsModule, IconComponent, PaginationComponent, SelectComponent, DateRangePickerComponent],
  providers: [NewsIndexPresenter],
  styles: [`
    .page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }

    /* 5 kartu panduan — kolom TETAP (bukan auto-fit/minmax) supaya selalu
       genap 1 baris penuh tanpa sisa slot kosong di baris kedua (itu yang
       terjadi sebelumnya: 4 kartu muat di baris 1, 1 kartu sendirian di
       baris 2 dengan ruang kosong lebar di sampingnya). Di layar sempit
       diturunkan ke 1 kolom (bertumpuk penuh) — bukan 2/3 kolom, supaya baris
       terakhir tidak pernah cuma terisi sebagian juga. */
    .guide-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
    .guide-card { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; }
    .guide-card h4 { margin: 0 0 3px; font-size: .84rem; }
    .guide-card p { margin: 0; font-size: .74rem; color: var(--color-muted); line-height: 1.4; }
    @media (max-width: 980px) { .guide-grid { grid-template-columns: 1fr; } }

    /* Baris 1: filter (status, target kolom + pencarian, rentang tanggal). */
    .filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; border-bottom: 1px solid var(--color-border); }
    .filter-row > app-select { min-width: 200px; }
    /* Field tanggal mengisi sisa ruang baris (bukan cuma selebar teksnya)
       supaya tidak ada jarak kosong menganggur di ujung kanan baris filter. */
    .filter-row > app-date-range-picker { flex: 1; min-width: 220px; }
    /* Satu kotak menyatu (select target kolom + input) — bukan dua field
       terpisah, supaya cincin fokus juga membungkus keduanya sekaligus
       (:focus-within pada wrapper), bukan cuma di sekitar input saja. */
    .search-combo {
      display: flex; align-items: stretch; overflow: hidden;
      border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff;
      transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .search-combo:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .search-combo app-select { flex-shrink: 0; min-width: 170px; }
    .search-combo app-select ::ng-deep .app-select-control { border: none !important; box-shadow: none !important; background: transparent; }
    .search-combo-divider { width: 1px; margin: 7px 0; background: var(--color-border); flex-shrink: 0; }
    .search-combo .search-input { flex: 1; min-width: 160px; width: 320px; max-width: 100%; padding: 12px 14px; font-size: .95rem; border: none; background: transparent; font-family: var(--font-body); }
    .search-combo .search-input:focus { outline: none; }

    /* Baris 2: refresh, adjust column, clear filter (kiri) — bulk action (kanan). */
    .table-toolbar { display: flex; align-items: center; gap: 8px; }
    .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: var(--radius-xs); border: 1px solid var(--color-border); background: #fff; color: var(--color-text-secondary); cursor: pointer; transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease; }
    .icon-btn:hover { background: var(--color-bg-alt); border-color: var(--color-border-strong); }

    /* Ikon kaca pembesar jadi bagian DALAM kotak search-combo (bukan tombol
       terpisah di luar) — tetap ikut cincin fokus bersama lewat :focus-within
       di wrapper, dan klik di sini men-trigger applySearch() sama seperti Enter. */
    .search-combo-btn { display: flex; align-items: center; justify-content: center; width: 36px; flex-shrink: 0; border: none; background: transparent; color: var(--color-muted); cursor: pointer; transition: color var(--motion-fast) ease; }
    .search-combo-btn:hover { color: var(--color-primary-dark); }
    .search-combo:focus-within .search-combo-btn { color: var(--color-primary); }

    /* Pill filter aktif — satu pill per kolom yang sudah di-Apply, bisa lebih
       dari satu sekaligus (beda dari kotak pencarian yang cuma satu kolom
       aktif dalam satu waktu). */
    .filter-pills { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding-top: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--color-border); }
    .filter-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 8px 5px 12px; border-radius: var(--radius-full); background: var(--color-primary-soft); color: var(--color-primary-dark); font-size: .8rem; font-weight: 600; }
    .filter-pill button { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border: none; border-radius: 50%; background: rgba(255,255,255,.6); color: inherit; cursor: pointer; }
    .filter-pill button:hover { background: #fff; }
    .filter-pills-reset { border: none; background: none; color: var(--color-danger); font-size: .8rem; font-weight: 700; cursor: pointer; padding: 5px 4px; }
    .filter-pills-reset:hover { text-decoration: underline; }

    .dropdown-wrap { position: relative; }
    .dropdown-toggle { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: var(--radius-xs); border: 1px solid var(--color-border); background: #fff; font-size: .85rem; font-weight: 600; color: var(--color-text); cursor: pointer; }
    .dropdown-toggle:hover { background: var(--color-bg-alt); }
    .dropdown-toggle .chevron { font-size: .65rem; color: var(--color-muted); transition: transform .15s ease; }
    .dropdown-toggle.open .chevron { transform: rotate(180deg); }
    /* Selalu di-render (bukan @if) supaya transisi tutup juga kelihatan —
       @if langsung mencabut elemen dari DOM begitu ditutup, jadi cuma
       transisi buka yang bisa kelihatan tanpa ini. */
    .dropdown-menu {
      position: absolute; top: calc(100% + 6px); left: 0; z-index: 200; min-width: 200px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-xs); box-shadow: var(--shadow-lg); padding: 6px;
      opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(-6px) scale(.97);
      transition: opacity .15s ease, transform .15s ease, visibility 0s linear .15s;
    }
    .dropdown-menu.right { left: auto; right: 0; }
    .dropdown-menu.open { opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0) scale(1); transition: opacity .15s ease, transform .15s ease, visibility 0s linear 0s; }
    @media (prefers-reduced-motion: reduce) { .dropdown-menu { transition: none; } }
    .dropdown-menu label { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 6px; font-size: .85rem; cursor: pointer; }
    .dropdown-menu label:hover { background: var(--color-bg-alt); }
    .dropdown-menu label.locked { color: var(--color-muted); cursor: not-allowed; }
    .dropdown-menu button.menu-item { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 8px 10px; border-radius: 6px; border: none; background: none; font-size: .85rem; font-weight: 600; color: var(--color-danger); cursor: pointer; }
    .dropdown-menu button.menu-item:hover:not(:disabled) { background: var(--color-danger-soft); }
    .dropdown-menu button.menu-item:disabled { color: var(--color-muted); cursor: not-allowed; }

    th.sortable { cursor: pointer; user-select: none; }
    th.sortable .col-sort { display: inline-flex; align-items: center; gap: 5px; }
    th.sortable .sort-icon { font-size: .68rem; color: var(--color-muted); }
    th.sortable.active .sort-icon { color: var(--color-primary); }
    th.sortable:hover { color: var(--color-primary-dark); }
    /* Baris tabel bisa diklik untuk buka Detail Berita (read-only) — kolom
       checkbox & Aksi menghentikan propagasi klik-nya sendiri (lihat
       template) supaya tidak ikut membuka detail saat sekadar centang/edit/
       publish/hapus. */
    tr.row-clickable { cursor: pointer; }
  `],
})
export class NewsIndexPage implements OnInit, OnDestroy, NewsIndexView {
  private presenter = inject(NewsIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);
  private el = inject(ElementRef<HTMLElement>);
  private router = inject(Router);

  readonly statusOptions = STATUS_OPTIONS;
  readonly searchTargetOptions = SEARCH_TARGET_OPTIONS;
  readonly columnDefs = COLUMN_DEFS;

  news = signal<News[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  busy = signal<ReadonlySet<number>>(new Set());
  selected = new Set<number>();

  // Baris 1: filter.
  status = '';
  searchTarget: SearchTarget = 'title';
  searchQuery = '';
  titleSearch = '';
  reporter = '';
  category = '';
  dateFrom = '';
  dateTo = '';

  // Baris 2: adjust column & bulk action dropdown state.
  adjustColumnOpen = signal(false);
  bulkActionOpen = signal(false);
  visibleColumns = signal<Set<SortColumn>>(new Set(COLUMN_DEFS.map((c) => c.key)));
  @ViewChild('adjustColumnWrap') adjustColumnWrap?: ElementRef<HTMLElement>;
  @ViewChild('bulkActionWrap') bulkActionWrap?: ElementRef<HTMLElement>;

  // Sorting per kolom.
  sortBy: SortColumn = DEFAULT_SORT_BY;
  sortDir: SortDir = DEFAULT_SORT_DIR;

  canCreate = this.auth.hasPermission('news.create');
  canUpdate = this.auth.hasPermission('news.update');
  canPublish = this.auth.hasPermission('news.publish');
  canDelete = this.auth.hasPermission('news.delete');

  /* Dicek per-dropdown terhadap wrapper-nya sendiri (bukan seluruh host
     komponen halaman) — sebelumnya dropdown ini cuma tertutup kalau klik
     benar-benar di luar SELURUH halaman (mis. ke sidebar), karena apa pun
     yang diklik di dalam halaman ini (termasuk tabel/card lain) tetap
     "contained" oleh host komponen sehingga tidak pernah dianggap "di luar". */
  private onDocumentClick = (event: MouseEvent): void => {
    const target = event.target as Node;
    if (this.adjustColumnOpen() && this.adjustColumnWrap && !this.adjustColumnWrap.nativeElement.contains(target)) {
      this.adjustColumnOpen.set(false);
    }
    if (this.bulkActionOpen() && this.bulkActionWrap && !this.bulkActionWrap.nativeElement.contains(target)) {
      this.bulkActionOpen.set(false);
    }
  };

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
    document.addEventListener('click', this.onDocumentClick, true);
  }
  ngOnDestroy(): void { document.removeEventListener('click', this.onDocumentClick, true); }

  get hasActiveFilters(): boolean {
    return !!(this.titleSearch || this.reporter || this.category || this.status || this.dateFrom || this.dateTo)
      || this.sortBy !== DEFAULT_SORT_BY || this.sortDir !== DEFAULT_SORT_DIR;
  }

  get searchPlaceholder(): string {
    const label = this.searchTargetOptions.find((o) => o.value === this.searchTarget)?.label ?? '';
    return `Cari ${label}…`;
  }

  isColumnVisible(key: SortColumn): boolean { return this.visibleColumns().has(key); }
  toggleColumn(col: ColumnDef): void {
    if (col.locked) return;
    this.visibleColumns.update((s) => {
      const next = new Set(s);
      next.has(col.key) ? next.delete(col.key) : next.add(col.key);
      return next;
    });
  }
  get visibleColumnCount(): number { return this.visibleColumns().size + 1; } // +1 kolom Aksi
  skeletonCols(): number[] { return Array.from({ length: this.visibleColumnCount }, (_, i) => i); }

  load(): void {
    this.loading.set(true);
    this.presenter.load(this.page(), this.limit, {
      search: this.titleSearch,
      reporter: this.reporter,
      category: this.category,
      status: this.status,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      sort: this.sortDir === 'desc' ? `-${this.sortBy}` : this.sortBy,
    });
  }

  applyFilters(): void { this.page.set(1); this.load(); }

  /* Menambahkan filter kolom yang sedang dipilih di dropdown target — TIDAK
     menghapus filter kolom lain yang sudah di-Apply sebelumnya, supaya bisa
     gabung lebih dari satu (mis. Judul + Reporter sekaligus), ditampilkan
     sebagai pill terpisah di bawah baris filter. */
  applySearch(): void {
    const value = this.searchQuery.trim();
    if (this.searchTarget === 'title') this.titleSearch = value;
    else if (this.searchTarget === 'reporter') this.reporter = value;
    else this.category = value;
    this.applyFilters();
  }

  onSearchTargetChange(v: unknown): void {
    this.searchTarget = (v as SearchTarget) ?? 'title';
    // Isi ulang kotak pencarian dengan nilai yang sudah di-Apply untuk kolom
    // itu (kalau ada) — supaya pindah target tidak terasa seperti kehilangan
    // filter yang sudah dipasang.
    this.searchQuery = this.searchTarget === 'title' ? this.titleSearch : this.searchTarget === 'reporter' ? this.reporter : this.category;
  }

  removeFilter(key: 'title' | 'reporter' | 'category' | 'status' | 'date'): void {
    if (key === 'title') this.titleSearch = '';
    else if (key === 'reporter') this.reporter = '';
    else if (key === 'category') this.category = '';
    else if (key === 'status') this.status = '';
    else { this.dateFrom = ''; this.dateTo = ''; }
    if (this.searchTarget === key) this.searchQuery = '';
    this.applyFilters();
  }

  get activeFilterPills(): { key: 'title' | 'reporter' | 'category' | 'status' | 'date'; label: string }[] {
    const pills: { key: 'title' | 'reporter' | 'category' | 'status' | 'date'; label: string }[] = [];
    if (this.titleSearch) pills.push({ key: 'title', label: `Judul: ${this.titleSearch}` });
    if (this.reporter) pills.push({ key: 'reporter', label: `Reporter: ${this.reporter}` });
    if (this.category) pills.push({ key: 'category', label: `Kategori: ${this.category}` });
    if (this.status) pills.push({ key: 'status', label: `Status: ${this.statusOptions.find((o) => o.value === this.status)?.label ?? this.status}` });
    if (this.dateFrom || this.dateTo) pills.push({ key: 'date', label: `Tanggal: ${this.dateFrom || '…'} → ${this.dateTo || '…'}` });
    return pills;
  }

  filterStatus(v: unknown): void { this.status = (v as string) ?? ''; this.applyFilters(); }
  onDateRangeChange(r: DateRange): void { this.dateFrom = r.from; this.dateTo = r.to; this.applyFilters(); }

  toggleSort(col: SortColumn): void {
    if (this.sortBy === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortBy = col; this.sortDir = 'desc'; }
    this.applyFilters();
  }

  clearFilters(): void {
    this.status = ''; this.searchTarget = 'title'; this.searchQuery = '';
    this.titleSearch = ''; this.reporter = ''; this.category = '';
    this.dateFrom = ''; this.dateTo = '';
    this.sortBy = DEFAULT_SORT_BY; this.sortDir = DEFAULT_SORT_DIR;
    this.applyFilters();
  }

  refresh(): void { this.load(); }

  goPage(p: number): void { this.page.set(p); this.load(); }
  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  toggleSelect(id: number, checked: boolean): void { if (checked) this.selected.add(id); else this.selected.delete(id); }
  isSelected(id: number): boolean { return this.selected.has(id); }
  get allSelected(): boolean { return this.news().length > 0 && this.news().every((n) => this.selected.has(n.newsID)); }
  toggleSelectAll(checked: boolean): void {
    if (checked) this.news().forEach((n) => this.selected.add(n.newsID));
    else this.news().forEach((n) => this.selected.delete(n.newsID));
  }

  viewNews(n: News): void { this.router.navigate(['/cms/news/view', n.newsID]); }

  togglePublish(n: News): void { this.setBusy(n.newsID); this.presenter.togglePublish(n); }

  async remove(n: News, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus berita "${n.newsTitle}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Berita', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(n.newsID);
    this.presenter.remove(n);
  }

  async bulkDelete(event?: Event): Promise<void> {
    if (this.selected.size === 0) return;
    this.bulkActionOpen.set(false);
    const ok = await this.alert.confirm(`Hapus ${this.selected.size} berita terpilih? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Berita Terpilih', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.presenter.bulkDelete([...this.selected]);
  }

  setNews(news: News[], count: number): void { this.news.set(news); this.count.set(count); this.loading.set(false); this.selected.clear(); }
  onPublishToggleSuccess(_wasPublished: boolean): void { this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onBulkDeleteSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
