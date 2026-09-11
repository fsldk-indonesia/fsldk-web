import { Component, ContentChild, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { Pagination } from '../../core/entities/pagination';
import { IconComponent } from '../icon.component';
import { PaginationComponent } from '../pagination.component';
import { SelectComponent } from '../select.component';
import { MultiSelectComponent, MultiSelectOption } from '../multi-select.component';
import { DateRangePickerComponent, DateRange } from '../date-range-picker.component';
import { CmsColumnDef, CmsComboboxOption, CmsFilterPill, CmsIndexConfig, CmsListParams, CmsSearchTargetDef } from './cms-index.types';

/**
 * Shell index CMS generik — hasil ekstraksi dari halaman index Berita (lihat
 * commit sebelumnya), dipakai lewat `<app-cms-index [config]="..." [dataSource]="...">`
 * dengan `<ng-template #rowTemplate let-row let-i="index" let-isColumnVisible="isColumnVisible">`
 * yang berisi `<td>` per baris (host bertanggung jawab penuh atas isi sel,
 * termasuk kolom Aksi) — lihat NewsIndexPage sebagai contoh pemakaian.
 *
 * Yang jadi tanggung jawab komponen ini: guide cards, filter (status/search-
 * combo termasuk mode combobox/rentang tanggal), filter pills, sort per
 * kolom, Atur Kolom, seleksi + Aksi Massal (hapus), pagination, loading
 * skeleton, dan empty-state. Yang TETAP jadi tanggung jawab halaman host:
 * page-head (judul + tombol tambah), isi sel tiap kolom termasuk kolom Aksi
 * (edit/publish/hapus per baris — aturannya beda-beda tiap modul).
 */
@Component({
  selector: 'app-cms-index',
  standalone: true,
  imports: [NgTemplateOutlet, FormsModule, RouterLink, IconComponent, PaginationComponent, SelectComponent, MultiSelectComponent, DateRangePickerComponent],
  templateUrl: './cms-index.component.html',
  styles: [`
    /* 5 kartu panduan — kolom TETAP (bukan auto-fit/minmax) supaya selalu
       genap 1 baris penuh tanpa sisa slot kosong di baris kedua. Di layar
       sempit diturunkan ke 1 kolom (bertumpuk penuh). */
    .guide-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
    .guide-card { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; }
    .guide-card h4 { margin: 0 0 3px; font-size: .84rem; }
    .guide-card p { margin: 0; font-size: .74rem; color: var(--color-muted); line-height: 1.4; }
    @media (max-width: 980px) { .guide-grid { grid-template-columns: 1fr; } }

    /* Baris 1: filter (status, target kolom + pencarian, rentang tanggal).
       nowrap — elemen menyusut lebih dulu lewat flex-shrink/min-width,
       tidak pernah pindah baris walau ruang agak sempit. */
    .filter-row { display: flex; flex-wrap: nowrap; align-items: center; gap: 10px; border-bottom: 1px solid var(--color-border); }
    .filter-row > app-select, .filter-row > app-multi-select { flex-shrink: 0; min-width: 200px; }
    /* TIDAK ikut flex-grow (beda dari search-combo) — isinya cuma teks
       tanggal pendek + ikon kalender, kalau dikasih flex-grow malah melebar
       kosong tak proporsional saat ruang sisa banyak. Lebar tetap (bukan
       ikut menyusut/melebar mengikuti sisa ruang), search-combo yang
       menyerap sisa ruang (satu-satunya yang flex-grow di baris ini). */
    .filter-row > app-date-range-picker { flex: 0 0 230px; }
    /* Combo-box (mode 'combobox', mis. Kategori/Role) SEKARANG memakai
       <app-multi-select> yang punya popup+trigger sendiri (lihat
       multi-select.component.ts) — bukan lagi text input + popup lokal di
       sini. Lebar popup-nya otomatis dibatasi ke trigger app-multi-select
       sendiri (bukan seluruh .search-combo), beda dari versi lama. */
    .search-combo {
      position: relative; display: flex; align-items: stretch; flex: 1.4; min-width: 380px;
      border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: #fff;
      transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .search-combo:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .search-combo > app-select { flex-shrink: 0; min-width: 170px; }
    .search-combo > app-select ::ng-deep .app-select-control { border: none !important; box-shadow: none !important; background: transparent; }
    .search-combo-divider { width: 1px; margin: 7px 0; background: var(--color-border); flex-shrink: 0; }
    .search-combo .search-input { flex: 1; min-width: 140px; padding: 12px 14px; font-size: .95rem; border: none; background: transparent; font-family: var(--font-body); }
    .search-combo .search-input:focus { outline: none; }
    .search-combo > app-multi-select { flex: 1; }
    .search-combo > app-multi-select ::ng-deep .ms-trigger { border: none; box-shadow: none !important; min-height: 44px; }

    /* Baris 2: refresh, adjust column (kiri) — bulk action (kanan). */
    .table-toolbar { display: flex; align-items: center; gap: 8px; }
    .icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: var(--radius-xs); border: 1px solid var(--color-border); background: #fff; color: var(--color-text-secondary); cursor: pointer; transition: background var(--motion-fast) ease, border-color var(--motion-fast) ease; }
    .icon-btn:hover { background: var(--color-bg-alt); border-color: var(--color-border-strong); }

    .search-combo-btn { display: flex; align-items: center; justify-content: center; width: 36px; flex-shrink: 0; border: none; background: transparent; color: var(--color-muted); cursor: pointer; transition: color var(--motion-fast) ease; }
    .search-combo-btn:hover { color: var(--color-primary-dark); }
    .search-combo:focus-within .search-combo-btn { color: var(--color-primary); }

    /* Pill filter aktif — satu pill per target yang sudah di-Apply, bisa
       lebih dari satu sekaligus. */
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
    /* Selalu di-render (bukan @if) supaya transisi tutup juga kelihatan. */
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
    tr.row-clickable { cursor: pointer; }
    /* Empty-state pakai class global .empty-state (styles.scss) apa adanya —
       sudah termasuk glow radial yang pas di sekitar ikon (.icon-badge::before),
       tidak perlu override di sini. */
  `],
})
export class CmsIndexComponent<T> implements OnInit, OnDestroy {
  private alert = inject(AlertService);

  @Input({ required: true }) config!: CmsIndexConfig<T>;
  @Input({ required: true }) dataSource!: (params: CmsListParams) => Observable<Pagination<T>>;
  /** Tampilkan kolom checkbox + dropdown "Aksi Massal" — set true kalau host
   *  memang mengizinkan hapus massal (biasanya = permission delete host). */
  @Input() bulkDeleteEnabled = false;
  /** Tampilkan `<th>Aksi</th>` — matikan kalau modul tidak punya kolom aksi. */
  @Input() showActionsColumn = true;
  /** Izin buat data baru — mengontrol tombol tambah cepat di empty-state
   *  (`config.createRoute`/`createLabel`), permission check tetap tanggung
   *  jawab halaman host. */
  @Input() canCreate = false;

  /** Emit setelah user klik baris — kalau tidak ada listener yang di-subscribe
   *  (`rowClick.observed`), baris tidak diberi style `row-clickable`/cursor. */
  @Output() rowClick = new EventEmitter<T>();
  /** Emit id baris terpilih SETELAH user konfirmasi dialog hapus massal bawaan
   *  komponen ini — host yang memanggil repository & (lewat @ViewChild) balik
   *  panggil `refresh()` setelah sukses, sama seperti pola onXxxSuccess->load()
   *  yang sudah dipakai di semua presenter. */
  @Output() bulkDelete = new EventEmitter<(string | number)[]>();

  @ContentChild('rowTemplate') rowTemplateRef!: TemplateRef<unknown>;

  rows = signal<T[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  selected = new Set<string | number>();

  /** Multi-select — array kosong = "Semua Status" (tidak ada yang dicentang),
   *  bukan lagi string tunggal. */
  status: string[] = [];
  searchTarget = '';
  searchQuery = '';
  /** Nilai tiap target SELALU array (multi-select untuk mode combobox, array
   *  1 elemen untuk mode text) — lihat CmsListParams.filters. */
  private appliedFilters: Record<string, string[]> = {};
  dateFrom = '';
  dateTo = '';

  sortBy = '';
  sortDir: 'asc' | 'desc' = 'desc';

  adjustColumnOpen = signal(false);
  bulkActionOpen = signal(false);
  visibleColumns = signal<Set<string>>(new Set());

  private comboOptionsCache = new Map<string, CmsComboboxOption[]>();
  comboOptions = signal<CmsComboboxOption[]>([]);

  @ViewChild('adjustColumnWrap') private adjustColumnWrap?: ElementRef<HTMLElement>;
  @ViewChild('bulkActionWrap') private bulkActionWrap?: ElementRef<HTMLElement>;

  /** Referensi stabil (bukan dibuat ulang tiap render) supaya dioper sebagai
   *  context ke ng-template proyeksi baris tanpa membuat binding baru tiap siklus CD. */
  isColumnVisible = (key: string): boolean => this.visibleColumns().has(key);

  // Popup Status & combobox (Kategori/Role dst.) sekarang MultiSelectComponent
  // sendiri yang urus buka/tutup + klik-di-luar (lihat multi-select.component.ts)
  // — tidak perlu lagi dicek di sini seperti versi single-select lama.
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
    this.sortBy = this.config.defaultSort.sortBy;
    this.sortDir = this.config.defaultSort.sortDir;
    this.visibleColumns.set(new Set(this.config.columns.map((c) => c.key)));
    if (this.config.searchTargets?.length) this.searchTarget = this.config.searchTargets[0].value;
    this.load();
    document.addEventListener('click', this.onDocumentClick, true);
  }
  ngOnDestroy(): void { document.removeEventListener('click', this.onDocumentClick, true); }

  get hasActiveFilters(): boolean {
    return Object.keys(this.appliedFilters).length > 0 || this.status.length > 0 || !!(this.dateFrom || this.dateTo)
      || this.sortBy !== this.config.defaultSort.sortBy || this.sortDir !== this.config.defaultSort.sortDir;
  }

  get currentSearchTarget(): CmsSearchTargetDef | undefined {
    return this.config.searchTargets?.find((t) => t.value === this.searchTarget);
  }
  get isComboboxTarget(): boolean { return this.currentSearchTarget?.mode === 'combobox'; }
  get searchPlaceholder(): string { return `Cari ${this.currentSearchTarget?.label ?? ''}…`; }

  toggleColumn(col: CmsColumnDef): void {
    if (col.locked) return;
    this.visibleColumns.update((s) => {
      const next = new Set(s);
      next.has(col.key) ? next.delete(col.key) : next.add(col.key);
      return next;
    });
  }
  get visibleColumnCount(): number { return this.visibleColumns().size + (this.showActionsColumn ? 1 : 0); }
  skeletonCols(): number[] { return Array.from({ length: this.visibleColumnCount }, (_, i) => i); }

  rowId(row: T): string | number { return (row as unknown as Record<string, unknown>)[this.config.rowIdKey] as string | number; }

  load(): void {
    this.loading.set(true);
    const params: CmsListParams = {
      page: this.page(), limit: this.config.limit ?? 10,
      sort: this.sortDir === 'desc' ? `-${this.sortBy}` : this.sortBy,
      status: [...this.status], dateFrom: this.dateFrom, dateTo: this.dateTo,
      filters: { ...this.appliedFilters },
    };
    this.dataSource(params).subscribe({
      next: (p) => { this.rows.set(p.data); this.count.set(p.count); this.loading.set(false); this.selected.clear(); },
      error: () => this.loading.set(false),
    });
  }

  /** Dipanggil host (lewat @ViewChild) setelah aksi yang mengubah data (edit
   *  status, hapus satuan, hapus massal) berhasil — sama seperti onXxxSuccess->load() di presenter lama. */
  refresh(): void { this.load(); }

  applyFilters(): void { this.page.set(1); this.load(); }

  applySearch(): void {
    const value = this.searchQuery.trim();
    if (!this.searchTarget) return;
    if (value) this.appliedFilters[this.searchTarget] = [value];
    else delete this.appliedFilters[this.searchTarget];
    this.applyFilters();
  }

  /** Nilai yang sudah diterapkan untuk satu target (dipakai binding
   *  [selected] <app-multi-select> di template — appliedFilters sendiri
   *  private, tidak bisa diakses langsung dari template). */
  appliedFilterValues(key: string): string[] { return this.appliedFilters[key] ?? []; }

  onSearchTargetChange(v: unknown): void {
    this.searchTarget = (v as string) ?? '';
    this.searchQuery = (this.appliedFilters[this.searchTarget] ?? [])[0] ?? '';
  }

  /** Dipanggil lewat (openedChange) <app-multi-select> — lazy-load opsi
   *  combobox (Kategori/Role dst.) hanya saat popup-nya pertama kali dibuka,
   *  di-cache per target sesudahnya (sama seperti pola onSearchFocus lama). */
  onComboOpened(isOpen: boolean): void {
    if (!isOpen) return;
    const t = this.currentSearchTarget;
    if (!t || t.mode !== 'combobox') return;
    if (this.comboOptionsCache.has(t.value)) {
      this.comboOptions.set(this.comboOptionsCache.get(t.value) ?? []);
      return;
    }
    t.loadOptions?.().subscribe((opts) => {
      this.comboOptionsCache.set(t.value, opts);
      if (this.currentSearchTarget?.value === t.value) this.comboOptions.set(opts);
    });
  }

  /** Opsi combobox saat ini, dipetakan ke bentuk MultiSelectOption (value =
   *  id di-stringify — appliedFilters/CmsListParams selalu string, konsisten
   *  dengan query param backend). */
  comboOptionsForSelect(): MultiSelectOption[] {
    return this.comboOptions().map((o) => ({ value: String(o.id), label: o.label }));
  }

  onComboSelectionChange(values: (string | number)[]): void {
    if (!this.searchTarget) return;
    const ids = values.map(String);
    if (ids.length) this.appliedFilters[this.searchTarget] = ids;
    else delete this.appliedFilters[this.searchTarget];
    this.applyFilters();
  }

  onStatusChange(values: (string | number)[]): void {
    this.status = values.map(String);
    this.applyFilters();
  }

  /** Label tampilan untuk satu nilai (id, distringify) target combobox —
   *  dicari dari cache opsi target itu (dipetakan saat popup-nya dibuka),
   *  dipakai activeFilterPills & pill di trigger. */
  private comboOptionLabel(targetKey: string, idStr: string): string {
    const cached = this.comboOptionsCache.get(targetKey) ?? [];
    return cached.find((o) => String(o.id) === idStr)?.label ?? idStr;
  }

  get activeFilterPills(): CmsFilterPill[] {
    const pills: CmsFilterPill[] = [];
    for (const t of this.config.searchTargets ?? []) {
      const vals = this.appliedFilters[t.value];
      if (!vals?.length) continue;
      const display = t.mode === 'combobox' ? vals.map((id) => this.comboOptionLabel(t.value, id)).join(', ') : vals.join(', ');
      pills.push({ key: t.value, label: `${t.label}: ${display}` });
    }
    if (this.status.length > 0) {
      const labels = this.status.map((v) => this.config.statusOptions?.find((o) => String(o.value) === v)?.label ?? v);
      pills.push({ key: '__status', label: `Status: ${labels.join(', ')}` });
    }
    if (this.dateFrom || this.dateTo) pills.push({ key: '__date', label: `Tanggal: ${this.dateFrom || '…'} → ${this.dateTo || '…'}` });
    return pills;
  }

  removeFilter(key: string): void {
    if (key === '__status') this.status = [];
    else if (key === '__date') { this.dateFrom = ''; this.dateTo = ''; }
    else { delete this.appliedFilters[key]; if (this.searchTarget === key) this.searchQuery = ''; }
    this.applyFilters();
  }

  onDateRangeChange(r: DateRange): void { this.dateFrom = r.from; this.dateTo = r.to; this.applyFilters(); }

  toggleSort(key: string): void {
    if (this.sortBy === key) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortBy = key; this.sortDir = 'desc'; }
    this.applyFilters();
  }

  clearFilters(): void {
    this.status = []; this.searchTarget = this.config.searchTargets?.[0]?.value ?? ''; this.searchQuery = '';
    this.appliedFilters = {};
    this.dateFrom = ''; this.dateTo = '';
    this.sortBy = this.config.defaultSort.sortBy; this.sortDir = this.config.defaultSort.sortDir;
    this.applyFilters();
  }

  goPage(p: number): void { this.page.set(p); this.load(); }

  onRowClick(row: T): void { if (this.rowClick.observed) this.rowClick.emit(row); }

  isSelected(id: string | number): boolean { return this.selected.has(id); }
  toggleSelect(id: string | number, checked: boolean): void { if (checked) this.selected.add(id); else this.selected.delete(id); }
  get allSelected(): boolean { return this.rows().length > 0 && this.rows().every((r) => this.selected.has(this.rowId(r))); }
  toggleSelectAll(checked: boolean): void {
    if (checked) this.rows().forEach((r) => this.selected.add(this.rowId(r)));
    else this.rows().forEach((r) => this.selected.delete(this.rowId(r)));
  }

  async onBulkDeleteClick(event?: Event): Promise<void> {
    if (this.selected.size === 0) return;
    this.bulkActionOpen.set(false);
    const ok = await this.alert.confirm(`Hapus ${this.selected.size} ${this.config.entityLabel} terpilih? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus yang Dipilih', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.bulkDelete.emit([...this.selected]);
  }
}
