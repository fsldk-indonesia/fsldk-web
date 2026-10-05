import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { IconComponent } from '../../../../shared/icon.component';
import { PageHeroComponent } from '../../../../shared/page-hero.component';
import { BottomSheetComponent } from '../../../../shared/bottom-sheet.component';
import { SearchFilterSortComponent, FilterFieldDef, SortOptionDef } from '../../../../shared/search-filter-sort.component';
import { ToastService } from '../../../../core/services/toast.service';
import { FinanceFormat } from '../../entities/finance-format';
import { FinanceFormatType } from '../../entities/finance-format-type';
import { FinanceFormatPublicList } from '../../entities/finance-format-public';
import { FinanceFormatPublicIndexPresenter } from './financeformat.public-index.presenter';
import { FinanceFormatPublicIndexView } from './financeformat.public-index.view';

/** One category card's data: the fixed type plus its active files (may be empty). */
interface FormatGroup {
  type: FinanceFormatType;
  files: FinanceFormat[];
}

const SORT_OPTIONS: SortOptionDef[] = [
  { value: 'default', label: 'Urutan Kategori', icon: 'list' },
  { value: 'name', label: 'Nama Kategori A-Z', icon: 'chevrons-up-down' },
  { value: 'count', label: 'Jumlah File Terbanyak', icon: 'file-spreadsheet' },
  { value: 'newest', label: 'Terbaru Diunggah', icon: 'clock' },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Tersedia' },
  { value: 'empty', label: 'Kosong' },
];

@Component({
  selector: 'app-financeformat-public-index-page',
  standalone: true,
  templateUrl: './financeformat.public-index.page.html',
  imports: [DatePipe, IconComponent, PageHeroComponent, BottomSheetComponent, SearchFilterSortComponent],
  providers: [FinanceFormatPublicIndexPresenter],
  styles: [`
    /* ---------- Siluet hero: lembar spreadsheet + tumpukan uang + jaringan
       "digambar sendiri" — mekanisme identik Kalender/Perpustakaan/Berita.
       ---------- */
    .hero-fmt-visual { position: relative; width: 100%; }
    .fmt-svg { position: relative; z-index: 1; width: 100%; height: 240px; overflow: visible; }

    .fmt-silhouette {
      transform-box: fill-box; transform-origin: 50% 100%; opacity: 0;
      animation: fmtGrow .9s cubic-bezier(.34,1.4,.64,1) forwards;
      filter: drop-shadow(0 10px 18px rgba(0,147,59,.2));
    }
    @keyframes fmtGrow { from { opacity: 0; transform: scale(.75) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fmt-ground-shadow { fill: var(--color-primary-dark); opacity: .14; }
    @media (prefers-reduced-motion: reduce) { .fmt-silhouette { animation: none; opacity: 1; transform: none; } }

    .fmt-line { fill: none; stroke: var(--color-primary); stroke-width: 1.8; stroke-linecap: round; opacity: .55; }
    .fmt-line.thick { stroke-width: 2.6; opacity: .75; stroke: var(--color-primary-bright); }
    .fmt-tier { opacity: 0; animation: fmtTierFadeIn .4s ease-out forwards; }
    .fmt-tier-0 { animation-delay: .75s; }
    .fmt-tier-1 { animation-delay: 1.3s; }
    .fmt-tier-2 { animation-delay: 1.8s; }
    @keyframes fmtTierFadeIn { from { opacity: 0; } to { opacity: 1; } }

    .fmt-badge {
      transform-box: fill-box; transform-origin: center; opacity: 0;
      animation: fmtBadgePop .5s cubic-bezier(.34,1.4,.64,1) 2.2s forwards;
    }
    @keyframes fmtBadgePop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .fmt-tier, .fmt-badge { animation: none; opacity: 1; transform: none; } }

    /* ---------- Section hijau PENUH tepi-ke-tepi + siluet ikon raksasa
       pudar — pola sama persis Jadwal/Perpustakaan/Berita. ---------- */
    .section { position: relative; overflow: hidden; background: var(--color-primary); padding: 56px 0 72px; }
    .fmt-panel-silhouette { position: absolute; right: 8px; bottom: 8px; z-index: 0; color: rgba(255,255,255,.12); transform: rotate(-12deg); pointer-events: none; }
    .fmt-panel-silhouette-2 { position: absolute; left: 8px; top: 8px; z-index: 0; color: rgba(255,255,255,.08); transform: rotate(16deg); pointer-events: none; }
    .section > .container { position: relative; z-index: 1; }

    .fmt-section-head { margin-bottom: 28px; }
    .fmt-section-head h2 { margin: 0 0 10px; color: #fff; }
    .fmt-section-subtitle { max-width: 560px; margin: 0 auto; color: rgba(255,255,255,.85); font-size: 1.02rem; line-height: 1.6; }

    @media (max-width: 640px) { .section { padding: 40px 0 56px; } }

    /* ---------- Toolbar putih di atas hijau solid — pola override sama
       seperti Perpustakaan (tombol Filter default-nya hijau, invisible di
       atas section hijau tanpa override ini). ---------- */
    .fmt-toolbar { max-width: 900px; margin: 0 auto 32px; }
    ::ng-deep .fmt-toolbar .sfs-btn-filter { background: #fff !important; color: var(--color-primary-dark) !important; }
    ::ng-deep .fmt-toolbar .sfs-btn-filter app-icon { color: var(--color-primary-dark) !important; }
    ::ng-deep .fmt-toolbar .sfs-btn-filter:hover { background: var(--color-primary-soft) !important; }
    ::ng-deep .fmt-toolbar .sfs-count { box-shadow: 0 0 0 2px var(--color-primary); }
    ::ng-deep .fmt-toolbar .sfs-active-chip { background: #fff; color: var(--color-primary-dark); box-shadow: var(--shadow-sm); }
    ::ng-deep .fmt-toolbar .sfs-active-chip button { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    ::ng-deep .fmt-toolbar .sfs-active-chip button:hover { background: var(--color-primary); color: #fff; }

    .fmt-panel-slab { background: #fff; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); max-width: 640px; margin: 0 auto; }
    .fmt-empty-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 10px; }
    .fmt-empty-actions .chip { display: inline-flex; align-items: center; gap: 6px; }

    /* ---------- Kartu "folder dokumen" — konsep BEDA dari rak buku
       (Perpustakaan: ribbon diagonal + tumpukan halaman) atau kartu produk
       (Goods: thumbnail persegi): tab warna menonjol di atas tepi kartu +
       badge ikon bertumpuk (kesan "beberapa file"), bukan sampul/foto. ---------- */
    .fmt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 26px; max-width: 1240px; margin: 0 auto; }

    .fmt-card {
      position: relative; margin-top: 10px; display: flex; flex-direction: column;
      background: #fff; border-radius: 18px; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);
      transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s cubic-bezier(.22,1,.36,1), border-color .3s ease;
    }
    /* "Tab" folder menonjol di tepi atas kartu — teknik dekoratif khas
       halaman ini, beda dari ribbon/cover modul lain. */
    .fmt-card::before {
      content: ''; position: absolute; top: -10px; left: 24px; width: 72px; height: 18px; border-radius: 10px 10px 0 0;
      background: linear-gradient(135deg, var(--color-primary-bright), var(--color-primary)); box-shadow: 0 -2px 6px rgba(0,0,0,.08);
    }
    .fmt-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); border-color: transparent; }

    .fmt-head { display: flex; align-items: flex-start; gap: 14px; padding: 24px 16px 14px; }
    /* Badge ikon bertumpuk — dua lapis persegi pudar di belakang badge utama,
       melambangkan "beberapa file" dalam satu kategori. */
    .fmt-icon-stack { position: relative; width: 44px; height: 44px; flex-shrink: 0; margin-right: 6px; }
    .fmt-icon-stack::before, .fmt-icon-stack::after { content: ''; position: absolute; inset: 0; border-radius: 14px; background: var(--color-primary-soft); }
    .fmt-icon-stack::before { transform: translate(4px, 4px); opacity: .6; }
    .fmt-icon-stack::after { transform: translate(8px, 8px); opacity: .3; }
    .fmt-icon-badge {
      position: relative; z-index: 1; width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary)); color: #fff; box-shadow: var(--shadow-sm);
    }
    .fmt-head-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; padding-top: 2px; }
    .fmt-head-text h3 { margin: 0; font-size: 1rem; line-height: 1.3; font-family: var(--font-heading); font-weight: 800; }

    .fmt-files { list-style: none; margin: 0; padding: 2px 16px 18px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .fmt-file {
      display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; background: var(--color-bg-warm);
      border: 1px solid transparent; transition: border-color .25s ease, transform .25s ease, box-shadow .25s ease;
    }
    .fmt-file:hover { border-color: var(--color-primary-soft); transform: translateX(3px); box-shadow: var(--shadow-sm); }
    .fmt-file-info { min-width: 0; flex: 1; }
    .fmt-file-info .name { display: block; font-weight: 600; font-size: .88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text); }
    .fmt-file-info .date { color: var(--color-muted); font-size: .74rem; }
    .fmt-file-actions { display: flex; gap: 6px; flex-shrink: 0; }

    .fmt-empty {
      margin: 0 16px 18px; padding: 20px 14px; border-radius: 14px; border: 1.5px dashed var(--color-border-strong);
      color: var(--color-muted); font-size: .82rem; text-align: center; flex: 1;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    }
    .fmt-empty app-icon { color: var(--color-border-strong); }

    .fmt-card-skel { background: #fff; border: 1px solid var(--color-border); border-radius: 18px; overflow: hidden; min-height: 160px; }

    /* ---------- Mobile: tile ringkas -> tap buka bottom sheet. ---------- */
    .fmt-tile-grid { display: none; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .fmt-tile {
      position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
      background: #fff; border: none; border-radius: 16px; padding: 16px 14px; box-shadow: var(--shadow-sm);
      text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .fmt-tile:active { transform: scale(.96); }
    .fmt-tile.is-empty { opacity: .65; }
    .fmt-tile-icon { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--color-primary-soft); color: var(--color-primary-dark); flex-shrink: 0; }
    .fmt-tile h4 { margin: 0; font-size: .86rem; line-height: 1.3; font-weight: 700; color: var(--color-text); }
    .fmt-tile-meta { display: inline-flex; align-items: center; gap: 5px; font-size: .72rem; font-weight: 600; color: var(--color-muted); }

    @media (max-width: 720px) { .fmt-grid { display: none; } .fmt-tile-grid { display: grid; } }

    /* ---------- Kartu kontak WhatsApp — kartu putih melayang di atas hijau
       solid, pola sama seperti agenda Jadwal/kartu buku Perpustakaan. ---------- */
    .cp-card {
      margin: 40px auto 0; max-width: 820px; display: flex; align-items: center; gap: 18px;
      padding: 22px 26px; background: #fff; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
    }
    .cp-card .cp-text { flex: 1; } .cp-card h4 { margin: 0 0 2px; } .cp-card p { margin: 0; color: var(--color-text-secondary); font-size: .9rem; }
    @media (max-width: 640px) { .cp-card { flex-direction: column; text-align: center; } }

    /* ---------- Sheet mobile: daftar file lengkap satu kategori. ---------- */
    .fmt-sheet-files { list-style: none; margin: 0 0 4px; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .fmt-sheet-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 30px 10px; color: var(--color-muted); text-align: center; }
  `],
})
export class FinanceFormatPublicIndexPage implements OnInit, AfterViewInit, OnDestroy, FinanceFormatPublicIndexView {
  private presenter = inject(FinanceFormatPublicIndexPresenter);
  private toast = inject(ToastService);

  loading = signal(true);
  private formatTypes = signal<FinanceFormatType[]>([]);
  private formats = signal<FinanceFormat[]>([]);
  cpName = signal('');
  cpPhone = signal('');

  searchText = signal('');
  filterValues = signal<Record<string, unknown>>({});
  currentSort = signal('default');
  readonly sortOptions = SORT_OPTIONS;

  /** Sheet mobile-only, tap tile kategori (grid desktop tidak butuh sheet). */
  sheetGroup = signal<FormatGroup | null>(null);

  @ViewChildren('fmtLine') private fmtLineRefs!: QueryList<ElementRef<SVGPathElement>>;

  // 9 category cards, ordered by the backend's sortOrder, each with its own
  // active files grouped client-side from the single flat `formats` list.
  groups = computed<FormatGroup[]>(() => {
    const byType = new Map<number, FinanceFormat[]>();
    for (const f of this.formats()) {
      const list = byType.get(f.formatTypeID) ?? [];
      list.push(f);
      byType.set(f.formatTypeID, list);
    }
    return this.formatTypes().map((type) => ({ type, files: byType.get(type.formatTypeID) ?? [] }));
  });

  filterFields = computed<FilterFieldDef[]>(() => {
    const fields: FilterFieldDef[] = [];
    if (this.formatTypes().length) {
      fields.push({
        key: 'formatTypeID', label: 'Kategori', icon: 'tags', multiple: true,
        options: this.formatTypes().map((t) => ({ value: t.formatTypeID, label: t.formatTypeName })),
      });
    }
    fields.push({ key: 'status', label: 'Status', icon: 'check-circle', multiple: true, options: STATUS_OPTIONS });
    return fields;
  });

  // Search + filter + sort jalan CLIENT-SIDE di atas `groups()` — endpoint
  // publik mengirim semua data sekaligus (tidak ada param search/filter di
  // backend). Kategori yang file-nya tidak cocok pencarian disembunyikan
  // total (bukan ditampilkan kosong) supaya tidak terbaca seolah "memang
  // belum ada file" saat sebenarnya cuma tidak match kata kunci.
  filteredGroups = computed<FormatGroup[]>(() => {
    const q = this.searchText().trim().toLowerCase();
    const filter = this.filterValues();
    const typeIDs = (filter['formatTypeID'] as number[] | undefined) ?? [];
    const statuses = (filter['status'] as string[] | undefined) ?? [];

    let result = this.groups().map((g) => ({
      type: g.type,
      files: q ? g.files.filter((f) => f.fileName.toLowerCase().includes(q)) : g.files,
    }));

    if (q) result = result.filter((g) => g.files.length > 0);
    if (typeIDs.length) result = result.filter((g) => typeIDs.includes(g.type.formatTypeID));
    if (statuses.length) {
      result = result.filter((g) => {
        const available = g.files.length > 0;
        return (statuses.includes('available') && available) || (statuses.includes('empty') && !available);
      });
    }

    switch (this.currentSort()) {
      case 'name':
        result = [...result].sort((a, b) => a.type.formatTypeName.localeCompare(b.type.formatTypeName));
        break;
      case 'count':
        result = [...result].sort((a, b) => b.files.length - a.files.length);
        break;
      case 'newest':
        result = [...result].sort((a, b) => this.latestTime(b.files) - this.latestTime(a.files));
        break;
    }
    return result;
  });

  totalFiles = computed(() => this.formats().length);
  // wa.me needs digits only; an empty phone hides the contact card entirely.
  whatsappLink = computed(() => `https://wa.me/${this.cpPhone().replace(/\D/g, '')}`);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
    // Section di halaman ini berakhir hijau solid — ruang negatif wave
    // footer perlu diisi hijau khusus di sini, pola sama persis Jadwal/Berita.
    document.documentElement.style.setProperty('--footer-wave-backdrop', 'var(--color-primary)');
  }

  ngAfterViewInit(): void {
    this.animateFmtLines();
  }

  ngOnDestroy(): void {
    document.documentElement.style.removeProperty('--footer-wave-backdrop');
  }

  // Download link points at the backend, which serves the file with a
  // Content-Disposition name = kebab-case of the user's fileName + .xlsx. The
  // trailing segment is decorative so a copied link is readable too.
  downloadUrl(f: FinanceFormat): string {
    return `${environment.apiBaseUrl}/public/finance-formats/${f.financeFormatID}/download/${this.slugName(f.fileName)}.xlsx`;
  }

  copy(url: string): void {
    navigator.clipboard.writeText(url).then(
      () => this.toast.success('Tautan disalin'),
      () => this.toast.error('Gagal menyalin tautan'),
    );
  }

  onSearchChange(value: string): void { this.searchText.set(value); }
  onFilterApply(values: Record<string, unknown>): void { this.filterValues.set(values); }
  onSortChange(sort: string): void { this.currentSort.set(sort); }

  activeFilterCount(): number {
    return Object.values(this.filterValues()).reduce((sum: number, v) => (Array.isArray(v) ? sum + v.length : sum), 0);
  }

  hasActiveSearchOrFilter(): boolean {
    return !!this.searchText() || this.activeFilterCount() > 0;
  }

  resetSearchAndFilter(): void {
    this.searchText.set('');
    this.filterValues.set({});
  }

  openSheet(g: FormatGroup): void { this.sheetGroup.set(g); }
  closeSheet(): void { this.sheetGroup.set(null); }

  private latestTime(files: FinanceFormat[]): number {
    if (!files.length) return -Infinity;
    return Math.max(...files.map((f) => new Date(f.createdDate).getTime()));
  }

  // Mirror of base/slug.Make on the backend: lowercase, non-alphanumeric runs
  // become a single hyphen, trimmed. The stored fileName is never touched.
  private slugName(name: string): string {
    const s = name.trim().toLowerCase()
      .replace(/\.xlsx$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return s || 'item';
  }

  /** Efek "jaringan digambar sendiri" — identik animateCalLines()/
   *  animateBookLines() di hero Jadwal/Perpustakaan. */
  private animateFmtLines(): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.fmtLineRefs?.forEach((ref, i) => {
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
  setData(data: FinanceFormatPublicList): void {
    this.formatTypes.set(data.formatTypes);
    this.formats.set(data.formats);
    this.cpName.set(data.cpName ?? '');
    this.cpPhone.set(data.cpPhone ?? '');
  }
}
