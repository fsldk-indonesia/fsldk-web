import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';
import { PopupModalComponent } from './popup-modal.component';
import { SelectComponent, SelectOption } from './select.component';

export interface FilterFieldDef {
  key: string;
  label: string;
  icon: string;
  options: SelectOption[];
  /** Bolehkan pilih lebih dari satu nilai (app-select [multiple]) — nilainya
   *  jadi array, ditampilkan sebagai satu chip per opsi terpilih (bukan satu
   *  chip gabungan) di baris chip filter aktif. Default false (single). */
  multiple?: boolean;
}

export interface SortOptionDef {
  value: string;
  label: string;
  icon?: string;
}

/**
 * Toolbar cari + filter + urutkan, reusable lintas halaman listing publik
 * (Galeri, dan modul lain di masa depan) — diadaptasi dari komponen
 * "Cari & Saring" ldksyahid-app (halaman Artikel): search bar bulat, tombol
 * "Filter" solid yang membuka popup berisi grid dropdown (field-nya
 * DATA-DRIVEN lewat [filterFields], bukan hardcode Tema/Penulis/Editor —
 * tiap pemanggil mendefinisikan field apa yang relevan untuk datanya
 * sendiri), dan tombol "Urutkan" dengan dropdown kecil bercentang.
 *
 * Search di-debounce 400ms sebelum emit (searchChange) supaya tidak memicu
 * request tiap ketikan. Filter TIDAK auto-apply — pemanggil baru menerima
 * (filterApply) saat tombol "Terapkan Filter" ditekan, supaya user bisa
 * mengisi beberapa field sekaligus sebelum request dikirim (pola sama
 * dengan referensi ldksyahid-app).
 */
@Component({
  selector: 'app-search-filter-sort',
  standalone: true,
  imports: [FormsModule, IconComponent, PopupModalComponent, SelectComponent],
  template: `
    <div class="sfs-row">
      <label class="sfs-search">
        <app-icon name="search" [size]="14" />
        <input type="text" [placeholder]="searchPlaceholder" [(ngModel)]="searchModel" (ngModelChange)="onSearchInput()" />
        @if (searchModel) {
          <button type="button" class="sfs-search-clear" (click)="clearSearch()" aria-label="Hapus pencarian"><app-icon name="x" [size]="11" /></button>
        }
      </label>

      @if (filterFields.length > 0) {
        <div class="sfs-filter-wrap">
          <button type="button" class="sfs-btn sfs-btn-filter" (click)="openFilterModal()">
            <app-icon name="sliders" [size]="14" /> Filter
            @if (activeFilterCount() > 0) { <span class="sfs-count">{{ activeFilterCount() }}</span> }
          </button>
          @if (activeFilterCount() > 0) {
            <button type="button" class="sfs-filter-clear" (click)="clearAllFilters()" aria-label="Hapus semua filter"><app-icon name="x" [size]="12" /></button>
          }
        </div>
      }

      @if (sortOptions.length > 0) {
        <div class="sfs-sort-wrap">
          <button type="button" class="sfs-btn sfs-btn-sort" [class.open]="sortMenuOpen()" (click)="toggleSortMenu()">
            <app-icon name="chevrons-up-down" [size]="14" /> Urutkan
          </button>
          <div class="sfs-sort-menu" [class.open]="sortMenuOpen()">
            @for (opt of sortOptions; track opt.value) {
              <button type="button" class="sfs-sort-item" [class.active]="opt.value === sortValue" (click)="chooseSort(opt.value)">
                @if (opt.icon) { <app-icon [name]="opt.icon" [size]="13" /> }
                <span>{{ opt.label }}</span>
                @if (opt.value === sortValue) { <app-icon name="check" [size]="12" class="sfs-sort-check" /> }
              </button>
            }
          </div>
        </div>
      }
    </div>

    <!-- Chip filter aktif — satu pill per field yang terisi, bisa dihapus
         satu-satu tanpa buka modal (pola sama seperti referensi
         ldksyahid-app: baris chip di bawah toolbar cari/filter/urutkan). -->
    @if (activeFilterChips().length > 0) {
      <div class="sfs-active-chips">
        @for (chip of activeFilterChips(); track chip.key + ':' + chip.value) {
          <span class="sfs-active-chip">
            <strong>{{ chip.label }}:</strong> {{ chip.value }}
            <button type="button" (click)="removeFilter(chip.key, chip.optionValue)" [attr.aria-label]="'Hapus filter ' + chip.label"><app-icon name="x" [size]="10" /></button>
          </span>
        }
      </div>
    }

    <app-popup-modal [open]="filterModalOpen()" [label]="filterTitle" [maxWidth]="560" [minHeight]="480" (closed)="closeFilterModal()">
      <!-- Wrapper flex-column sendiri (BUKAN diserahkan ke .popup-modal-body
           milik app-popup-modal — itu block biasa, di luar jangkauan style
           komponen ini karena view encapsulation) supaya footer bisa didorong
           ke dasar kartu (margin-top:auto) mengisi min-height 480px yang
           diminta, bukan menyisakan ruang kosong menggantung di bawah footer. -->
      <div class="sfs-filter-modal-body">
        <div class="sfs-filter-head">
          <span class="chip chip-green"><app-icon name="filter" [size]="12" /> Cari &amp; Saring</span>
          <span class="sfs-filter-badge"><app-icon name="sliders" [size]="18" /></span>
        </div>
        <h3 class="sfs-filter-title">{{ filterTitle }}</h3>
        <p class="sfs-filter-subtitle">{{ filterSubtitle }}</p>

        <div class="sfs-filter-grid">
          @for (f of filterFields; track f.key) {
            <div class="sfs-filter-field">
              <label class="sfs-filter-label"><app-icon [name]="f.icon" [size]="13" /> {{ f.label }}</label>
              <app-select [options]="f.options" [multiple]="!!f.multiple" [searchable]="true" placeholder="Semua" [ngModel]="draftFilterValues[f.key] ?? (f.multiple ? [] : null)" (ngModelChange)="draftFilterValues[f.key] = $event" />
            </div>
          }
        </div>

        <div class="sfs-filter-footer">
          <button type="button" class="sfs-footer-btn sfs-footer-close" (click)="closeFilterModal()"><app-icon name="x" [size]="13" /> Tutup</button>
          <button type="button" class="sfs-footer-btn sfs-footer-reset" (click)="resetFilter()"><app-icon name="rotate-ccw" [size]="13" /> Reset</button>
          <button type="button" class="sfs-footer-btn sfs-footer-apply" (click)="applyFilter()"><app-icon name="check" [size]="13" /> Terapkan Filter</button>
        </div>
      </div>
    </app-popup-modal>
  `,
  styles: [`
    .sfs-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .sfs-search {
      flex: 1 1 260px; min-width: 220px; display: flex; align-items: center; gap: 10px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-full);
      padding: 12px 18px; color: var(--color-muted);
      transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .sfs-search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .sfs-search input { flex: 1; border: none; outline: none; background: none; font-size: .92rem; color: var(--color-text); font-family: var(--font-body); }
    .sfs-search input::placeholder { color: var(--color-muted); }
    .sfs-search-clear {
      flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%;
      border: none; background: var(--color-bg-alt); color: var(--color-text-secondary); cursor: pointer;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .sfs-search-clear:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }

    .sfs-btn {
      flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px;
      height: 46px; padding: 0 20px; border-radius: var(--radius-full); border: 1.5px solid var(--color-primary);
      font-size: .88rem; font-weight: 700; cursor: pointer; white-space: nowrap;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out);
    }
    .sfs-btn-filter { background: var(--color-primary); color: #fff; position: relative; }
    .sfs-btn-filter:hover { background: var(--color-primary-dark); transform: translateY(-2px); box-shadow: 0 6px 18px color-mix(in srgb, var(--color-primary) 30%, transparent); }
    /* Badge jumlah filter aktif — mengambang di sudut kanan-atas tombol
       Filter (bukan inline di sebelah teks), warna danger supaya kontras
       jelas dengan pill hijau di baliknya — pola sama seperti badge notifikasi. */
    .sfs-count {
      position: absolute; top: -6px; right: -6px;
      display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 5px;
      border-radius: var(--radius-full); background: var(--color-danger); color: #fff; font-size: .7rem; font-weight: 800;
      box-shadow: 0 0 0 2px #fff;
    }
    .sfs-btn-sort { background: #fff; color: var(--color-primary-dark); }
    .sfs-btn-sort:hover, .sfs-btn-sort.open { background: var(--color-primary-soft); }

    /* Tombol kecil terpisah di sebelah Filter — hapus SEMUA filter sekaligus
       tanpa perlu buka modal (cuma muncul saat ada filter aktif). */
    .sfs-filter-wrap { position: relative; flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
    .sfs-filter-clear {
      flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%;
      border: 1.5px solid var(--color-danger); background: var(--color-danger-soft); color: var(--color-danger); cursor: pointer;
      transition: background var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out);
    }
    .sfs-filter-clear:hover { background: var(--color-danger); color: #fff; transform: translateY(-2px); }

    /* ---------- Chip filter aktif ---------- */
    .sfs-active-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .sfs-active-chip {
      display: inline-flex; align-items: center; gap: 6px; padding: 7px 8px 7px 14px;
      border-radius: var(--radius-full); background: var(--color-primary-soft); color: var(--color-primary-dark);
      font-size: .8rem; font-weight: 600; max-width: 100%;
    }
    .sfs-active-chip strong { font-weight: 700; }
    .sfs-active-chip button {
      flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%;
      border: none; background: rgba(255,255,255,.7); color: var(--color-primary-dark); cursor: pointer;
      transition: background var(--motion-fast) ease;
    }
    .sfs-active-chip button:hover { background: #fff; }

    /* ---------- Dropdown "Urutkan" — popover relatif sederhana (bukan
       position:fixed + reposition seperti app-select) karena tombolnya
       selalu ada di baris toolbar dengan ruang kosong yang cukup di bawah. ---------- */
    .sfs-sort-wrap { position: relative; flex-shrink: 0; }
    .sfs-sort-menu {
      position: absolute; top: calc(100% + 8px); right: 0; z-index: 40; min-width: 190px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
      padding: 6px; display: flex; flex-direction: column; gap: 2px;
      opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(-6px) scale(.98);
      transition: opacity var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out), visibility 0s linear var(--motion-fast);
    }
    .sfs-sort-menu.open { opacity: 1; visibility: visible; pointer-events: auto; transform: none; transition: opacity var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out), visibility 0s linear 0s; }
    .sfs-sort-item {
      display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: none; background: none;
      border-radius: 10px; font-size: .86rem; font-weight: 600; color: var(--color-text); cursor: pointer; text-align: left;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease;
    }
    .sfs-sort-item:hover { background: var(--color-bg-alt); }
    .sfs-sort-item.active { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .sfs-sort-check { margin-left: auto; color: var(--color-primary); }

    /* ---------- Modal Filter ---------- */
    /* flex:1 + flex-direction:column — mengisi penuh .popup-modal-body (yang
       sekarang juga flex:1, lihat popup-modal.component.ts) supaya footer
       bisa didorong ke dasar kartu (margin-top:auto di .sfs-filter-footer)
       saat [minHeight] bikin kartu lebih tinggi dari konten aslinya. */
    .sfs-filter-modal-body { display: flex; flex-direction: column; flex: 1; }
    /* Chip + badge sebagai satu grup di tengah — bukan lagi absolute di
       pojok kanan (itu dulu cuma buat hindari tabrakan sama tombol close
       bawaan app-popup-modal). Baris pendek + card cukup lebar (560px)
       artinya grup ini natural tidak pernah mendekati pojok kanan tempat
       tombol close (top:14px;right:14px) duduk, jadi aman tanpa trik posisi. */
    .sfs-filter-head { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 20px; }
    .sfs-filter-badge {
      display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 14px; flex-shrink: 0;
      background: linear-gradient(150deg, var(--color-primary-bright), var(--color-primary)); color: #fff; box-shadow: var(--shadow-sm);
    }
    .sfs-filter-title { margin: 0 0 8px; font-family: var(--font-heading); font-weight: 800; font-size: 1.3rem; color: var(--color-text); }
    .sfs-filter-subtitle { margin: 0 0 26px; font-size: .88rem; color: var(--color-text-secondary); }

    .sfs-filter-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; margin-bottom: 28px; }
    /* min-width:0 WAJIB — grid item defaultnya min-width:auto, artinya track
       ikut melebar mengikuti lebar intrinsik konten anaknya (label opsi
       terpilih yang panjang di app-select) walau app-select sendiri sudah
       truncate via overflow:hidden/text-overflow:ellipsis. Tanpa ini kartu
       modal (max-width:380px) meluber ke samping & muncul scrollbar horizontal. */
    .sfs-filter-field { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
    .sfs-filter-label { display: flex; align-items: center; gap: 6px; font-size: .8rem; font-weight: 700; color: var(--color-text); }
    .sfs-filter-label app-icon { color: var(--color-primary); }

    .sfs-filter-footer { display: flex; gap: 8px; flex-wrap: wrap; margin-top: auto; }
    .sfs-footer-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      height: 42px; padding: 0 14px; border-radius: var(--radius-full); font-size: .84rem; font-weight: 700; cursor: pointer;
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out);
    }
    .sfs-footer-close { flex: 0 0 auto; background: #fff; border: 1px solid var(--color-border-strong); color: var(--color-text-secondary); }
    .sfs-footer-close:hover { border-color: var(--color-primary); color: var(--color-primary-dark); }
    .sfs-footer-reset { flex: 0 0 auto; background: #fff; border: 1px solid var(--color-gold); color: var(--color-gold-dark); }
    .sfs-footer-reset:hover { background: var(--color-gold-soft); }
    .sfs-footer-apply {
      flex: 1 1 auto; border: none; color: #fff;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      box-shadow: 0 8px 22px color-mix(in srgb, var(--color-primary) 38%, transparent);
    }
    .sfs-footer-apply:hover { transform: translateY(-2px); box-shadow: 0 12px 28px color-mix(in srgb, var(--color-primary) 44%, transparent); }

    @media (max-width: 480px) {
      .sfs-row { gap: 8px; }
      .sfs-btn { padding: 0 16px; height: 42px; font-size: .82rem; }
      /* Search penuh selebar baris (baris sendiri, sudah otomatis lewat
         flex-wrap karena flex-basis:260px-nya lebih lebar dari sisa ruang).
         Filter & Urutkan dulu cuma nempel kiri menyisakan ruang kosong di
         kanan (auto-width mengikuti konten) — sekarang dibuat berbagi baris
         itu rata 50/50 (flex:1) supaya terlihat sengaja dirancang, bukan
         numpuk kiri kebetulan karena wrap. */
      .sfs-filter-wrap, .sfs-sort-wrap { flex: 1 1 0; }
      .sfs-btn-filter, .sfs-btn-sort { width: 100%; justify-content: center; }
      .sfs-filter-grid { grid-template-columns: 1fr; }
      /* Dropdown Urutkan ngikut lebar .sfs-sort-wrap yang sekarang sudah
         proporsional (bukan lagi cuma selebar tombol) — left/right:0 relatif
         ke wrapper-nya sendiri, bukan ke seluruh baris .sfs-row. */
      .sfs-sort-menu { left: 0; right: 0; min-width: 0; }
    }
  `],
})
export class SearchFilterSortComponent implements OnChanges, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);

  @Input() searchPlaceholder = 'Cari...';
  @Input() searchValue = '';
  @Input() filterFields: FilterFieldDef[] = [];
  @Input() filterValues: Record<string, unknown> = {};
  @Input() sortOptions: SortOptionDef[] = [];
  @Input() sortValue = '';
  @Input() filterTitle = 'Filter';
  @Input() filterSubtitle = 'Pilih satu atau lebih filter untuk menyaring data.';

  @Output() searchChange = new EventEmitter<string>();
  @Output() filterApply = new EventEmitter<Record<string, unknown>>();
  @Output() sortChange = new EventEmitter<string>();

  searchModel = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  filterModalOpen = signal(false);
  draftFilterValues: Record<string, unknown> = {};

  sortMenuOpen = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if ('searchValue' in changes) this.searchModel = this.searchValue;
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchDebounce);
  }

  onSearchInput(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.searchChange.emit(this.searchModel.trim()), 400);
  }

  clearSearch(): void {
    clearTimeout(this.searchDebounce);
    this.searchModel = '';
    this.searchChange.emit('');
  }

  openFilterModal(): void {
    this.draftFilterValues = { ...this.filterValues };
    this.filterModalOpen.set(true);
  }

  closeFilterModal(): void {
    this.filterModalOpen.set(false);
  }

  resetFilter(): void {
    this.draftFilterValues = {};
  }

  applyFilter(): void {
    this.filterApply.emit({ ...this.draftFilterValues });
    this.filterModalOpen.set(false);
  }

  /** Jumlah NILAI filter aktif total — field multi-select dengan 3 opsi
   *  terpilih dihitung 3 (bukan 1), supaya badge di tombol Filter selalu
   *  mencerminkan jumlah chip yang sebenarnya tampil di bawah toolbar. */
  activeFilterCount(): number {
    return Object.values(this.filterValues).reduce((sum: number, v) => {
      if (Array.isArray(v)) return sum + v.length;
      return v !== null && v !== undefined && v !== '' ? sum + 1 : sum;
    }, 0);
  }

  /** Satu chip PER NILAI (bukan per field) — field multi-select dengan 3
   *  opsi terpilih menghasilkan 3 chip terpisah, masing-masing bisa dihapus
   *  sendiri tanpa membuang pilihan lain di field yang sama. */
  activeFilterChips(): { key: string; optionValue: unknown; label: string; value: string }[] {
    const chips: { key: string; optionValue: unknown; label: string; value: string }[] = [];
    for (const f of this.filterFields) {
      const raw = this.filterValues[f.key];
      const rawValues = Array.isArray(raw) ? raw : raw !== null && raw !== undefined && raw !== '' ? [raw] : [];
      for (const rv of rawValues) {
        const label = f.options.find((o) => o.value === rv)?.label ?? String(rv);
        chips.push({ key: f.key, optionValue: rv, label: f.label, value: label });
      }
    }
    return chips;
  }

  /** Hapus satu NILAI dari field (kalau multi, pilihan lain di field yang
   *  sama tetap ada); kalau field itu jadi kosong (atau memang single),
   *  key-nya dihapus total. */
  removeFilter(key: string, optionValue: unknown): void {
    const next = { ...this.filterValues };
    const current = next[key];
    if (Array.isArray(current)) {
      const remaining = current.filter((v) => v !== optionValue);
      if (remaining.length > 0) next[key] = remaining; else delete next[key];
    } else {
      delete next[key];
    }
    this.filterApply.emit(next);
  }

  clearAllFilters(): void {
    this.filterApply.emit({});
  }

  toggleSortMenu(): void {
    this.sortMenuOpen.update((v) => !v);
  }

  chooseSort(value: string): void {
    this.sortChange.emit(value);
    this.sortMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.sortMenuOpen() && !this.el.nativeElement.contains(event.target as Node)) this.sortMenuOpen.set(false);
  }
}
