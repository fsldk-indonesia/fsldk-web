import { Component, ElementRef, Input, OnDestroy, forwardRef, inject, signal } from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: unknown;
  label: string;
}

/**
 * Dropdown kustom pengganti <select> bawaan browser — popup opsi native tidak
 * bisa direstyle lintas-browser (warna highlight, radius, dst mengikuti OS),
 * jadi seluruh markup dropdown (termasuk daftar opsinya) dirender sendiri di
 * sini supaya konsisten dengan desain form lain.
 */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="app-select" [class.open]="open()" [class.disabled]="disabled">
      <button type="button" class="app-select-control" [disabled]="disabled"
              (click)="toggle()" (keydown)="onKeydown($event)"
              aria-haspopup="listbox" [attr.aria-expanded]="open()">
        <span [class.placeholder]="!selectedOption()">{{ selectedOption()?.label ?? placeholder }}</span>
        <i class="fas fa-chevron-down"></i>
      </button>
      <div class="app-select-menu" [class.open]="open()"
           [style.top.px]="pos().top" [style.left.px]="pos().left"
           [style.width.px]="pos().width">
        @if (searchable) {
          <input class="app-select-search" type="text" placeholder="Cari…" [(ngModel)]="query"
                 (ngModelChange)="onQueryChange()" (click)="$event.stopPropagation()" (keydown)="onSearchKeydown($event)">
        }
        <ul class="app-select-list" role="listbox" [style.maxHeight.px]="listMaxH()">
          @for (opt of filteredOptions(); track opt.value; let i = $index) {
            <li role="option" [attr.aria-selected]="opt.value === value"
                [class.selected]="opt.value === value" [class.active]="i === activeIndex()"
                (mouseenter)="activeIndex.set(i)" (click)="choose(opt)">{{ opt.label }}</li>
          } @empty {
            <li class="empty">Tidak ada pilihan</li>
          }
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .app-select { position: relative; }
    .app-select-control {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 12px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-xs);
      font-family: var(--font-body); font-size: .95rem; color: var(--color-text); background: #fff;
      cursor: pointer; text-align: left; transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .app-select-control span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .app-select-control span.placeholder { color: var(--color-muted); }
    .app-select-control i { font-size: .75rem; color: var(--color-muted); flex-shrink: 0; transition: transform var(--motion-fast) ease; }
    .app-select.open .app-select-control { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .app-select.open .app-select-control i { transform: rotate(180deg); }
    .app-select.disabled .app-select-control { background: var(--color-bg-alt); color: var(--color-muted); cursor: not-allowed; }
    /* Selalu di-render (bukan @if) supaya transisi TUTUP juga kelihatan —
       @if mencabut elemen dari DOM sesaat menu ditutup, jadi cuma transisi
       buka yang sempat kelihatan. Posisi (top/left/width) tetap dihitung JS
       lewat reposition() persis seperti sebelumnya, cuma dipanggilnya tetap
       hanya saat open() true (lihat onViewportChange) — nilai pos() saat
       tertutup boleh basi karena elemen toh tidak terlihat/tidak bisa diklik. */
    .app-select-menu {
      position: fixed; z-index: 1000;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-xs);
      box-shadow: var(--shadow-lg); margin: 0; padding: 6px;
      display: flex; flex-direction: column; gap: 3px;
      opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(-4px) scale(.98);
      transition: opacity .12s ease, transform .12s ease, visibility 0s linear .12s;
    }
    .app-select-menu.open { opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0) scale(1); transition: opacity .12s ease, transform .12s ease, visibility 0s linear 0s; }
    @media (prefers-reduced-motion: reduce) { .app-select-menu { transition: none; } }
    /* Kotak cari-dalam-daftar — dipakai untuk dropdown berisi banyak opsi
       (mis. Provinsi/Kota-Kabupaten dari wilayah.id), diaktifkan lewat
       [searchable]="true". Filter murni client-side (filteredOptions()) —
       opsinya sudah dimuat penuh sekali oleh presenter, sama seperti pola
       .role-search di RoleIndexPage. */
    .app-select-search {
      flex-shrink: 0; margin-bottom: 4px; padding: 8px 10px; border: 1px solid var(--color-border);
      border-radius: 6px; font-size: .85rem; font-family: var(--font-body); color: var(--color-text);
    }
    .app-select-search:focus { outline: none; border-color: var(--color-primary); }
    .app-select-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; overscroll-behavior: contain; }
    .app-select-list li { padding: 11px 14px; border-radius: 8px; font-size: .95rem; color: var(--color-text); cursor: pointer; }
    .app-select-list li:hover { background: var(--color-bg-alt); }
    .app-select-list li.active { background: var(--color-bg-alt); }
    .app-select-list li.selected { background: var(--color-primary-soft); color: var(--color-primary-dark); font-weight: 600; }
    .app-select-list li.selected.active { background: var(--color-primary); color: #fff; }
    .app-select-list li.empty { color: var(--color-muted); cursor: default; }
    .app-select-list li.empty:hover { background: none; }
  `],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }],
})
export class SelectComponent implements ControlValueAccessor, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);

  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Pilih…';
  @Input() disabled = false;
  /** Tampilkan kotak cari-dalam-daftar di atas opsi — nyalakan untuk daftar
   *  panjang (mis. Provinsi/Kota-Kabupaten dari wilayah.id). */
  @Input() searchable = false;

  value: unknown = null;
  open = signal(false);
  activeIndex = signal(-1); // keyboard-highlighted option
  query = '';
  pos = signal({ top: 0, left: 0, width: 0, maxH: 240 });

  /** Opsi yang cocok dengan `query` (label, case-insensitive) — dipakai
   *  template & navigasi keyboard alih-alih `options` mentah saat
   *  `searchable` aktif. Selalu = `options` saat query kosong. */
  filteredOptions(): SelectOption[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.options;
    return this.options.filter((o) => o.label.toLowerCase().includes(q));
  }

  /** Tinggi maksimum daftar opsi = tinggi total popup (pos().maxH) dikurangi
   *  tinggi kotak cari (kalau ada) — supaya popup tidak melebihi maxH yang
   *  sudah dihitung reposition() memperhitungkan ruang viewport tersisa. */
  listMaxH(): number {
    return this.searchable ? Math.max(80, this.pos().maxH - 44) : this.pos().maxH;
  }

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  /* Menu is position:fixed so it escapes clipping ancestors (table wrappers,
     cards, modals). Fixed coords don't track the page, so on an OUTSIDE scroll
     (page / modal body) we re-place the menu under its trigger. A scroll that
     originates inside the option list is the user scrolling the options — leave
     it alone; closing the menu there broke wheel/scrollbar/arrow-key scrolling. */
  private onViewportChange = (event: Event): void => {
    if (!this.open()) return;
    if (event.type === 'scroll') {
      const menu = this.el.nativeElement.querySelector('.app-select-menu');
      if (menu && event.target instanceof Node && menu.contains(event.target)) return;
    }
    this.reposition();
  };

  /* Ditutup lewat listener capture-phase di document, bukan HostListener bubble-phase —
     modal induk (mis. role/user) memanggil $event.stopPropagation() pada klik di dalam
     dirinya sendiri supaya klik di dalam modal tidak menutup modal-backdrop, tapi itu
     juga membuat klik di dalam modal (di luar dropdown ini) tidak pernah sampai ke
     listener bubble-phase di document. Capture-phase berjalan sebelum stopPropagation
     tersebut sempat dipanggil, jadi dropdown tetap konsisten tertutup. */
  private onDocumentClick = (event: MouseEvent): void => {
    if (this.open() && !this.el.nativeElement.contains(event.target as Node)) this.open.set(false);
  };

  constructor() {
    document.addEventListener('click', this.onDocumentClick, true);
    window.addEventListener('scroll', this.onViewportChange, true);
    window.addEventListener('resize', this.onViewportChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick, true);
    window.removeEventListener('scroll', this.onViewportChange, true);
    window.removeEventListener('resize', this.onViewportChange);
  }

  selectedOption(): SelectOption | undefined {
    return this.options.find((o) => o.value === this.value);
  }

  toggle(): void {
    if (this.disabled) return;
    if (this.open()) { this.close(); return; }
    this.openMenu();
  }

  private openMenu(): void {
    this.reposition();
    this.query = '';
    const sel = this.filteredOptions().findIndex((o) => o.value === this.value);
    this.activeIndex.set(sel >= 0 ? sel : 0);
    this.open.set(true);
    if (this.searchable) {
      // Fokus langsung ke kotak cari supaya pengguna bisa mengetik tanpa klik
      // tambahan — beda dari trigger biasa (di bawah) yang dipertahankan
      // fokusnya supaya panah/Enter tetap tertangkap onKeydown.
      setTimeout(() => (this.el.nativeElement.querySelector('.app-select-search') as HTMLElement | null)?.focus());
    } else {
      // Keep focus on the trigger so arrow keys / Enter reach onKeydown even when
      // the menu was opened by something other than a real focusing click.
      (this.el.nativeElement.querySelector('.app-select-control') as HTMLElement | null)?.focus();
    }
    this.scrollActiveIntoView();
  }

  private close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
  }

  /** Ketikan di kotak cari menyaring daftar (filteredOptions()) — activeIndex
   *  di-reset ke 0 tiap kali hasil filter berubah supaya panah/Enter langsung
   *  konsisten dengan opsi yang sedang tersorot secara visual. */
  onQueryChange(): void {
    this.activeIndex.set(this.filteredOptions().length > 0 ? 0 : -1);
  }

  /** handler ini hanya menangani navigasi keyboard yang tetap harus
   *  berfungsi walau fokus ada di input cari, bukan di trigger. */
  onSearchKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); this.moveActive(1); break;
      case 'ArrowUp': event.preventDefault(); this.moveActive(-1); break;
      case 'Enter': {
        event.preventDefault();
        const opt = this.filteredOptions()[this.activeIndex()];
        if (opt) this.choose(opt);
        break;
      }
      case 'Escape': event.preventDefault(); this.close(); break;
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.open() ? this.moveActive(1) : this.openMenu();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.open() ? this.moveActive(-1) : this.openMenu();
        break;
      case 'Home':
        if (this.open()) { event.preventDefault(); this.setActive(0); }
        break;
      case 'End':
        if (this.open()) { event.preventDefault(); this.setActive(this.filteredOptions().length - 1); }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.open()) {
          const opt = this.filteredOptions()[this.activeIndex()];
          if (opt) this.choose(opt);
        } else {
          this.openMenu();
        }
        break;
      case 'Escape':
        if (this.open()) { event.preventDefault(); this.close(); }
        break;
      case 'Tab':
        if (this.open()) this.close();
        break;
    }
  }

  private moveActive(delta: number): void {
    const n = this.filteredOptions().length;
    if (n === 0) return;
    this.setActive(Math.min(n - 1, Math.max(0, this.activeIndex() + delta)));
  }

  private setActive(i: number): void {
    this.activeIndex.set(i);
    this.scrollActiveIntoView();
  }

  private scrollActiveIntoView(): void {
    setTimeout(() => {
      const items = this.el.nativeElement.querySelectorAll('.app-select-list li');
      (items[this.activeIndex()] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
    });
  }

  /** Place the fixed menu below the control, or above it when space is short. */
  private reposition(): void {
    const r = this.el.nativeElement.getBoundingClientRect();
    const gap = 10;
    const desired = Math.min((this.options.length || 1) * 42 + 14, 240);
    const below = window.innerHeight - r.bottom - gap;
    const above = r.top - gap;
    const up = below < Math.min(desired, 180) && above > below;
    const maxH = Math.max(120, Math.min(desired, up ? above : below));
    this.pos.set({
      top: up ? r.top - gap - maxH : r.bottom + gap,
      left: r.left,
      width: r.width,
      maxH,
    });
  }

  choose(opt: SelectOption): void {
    this.value = opt.value;
    this.onChange(this.value);
    this.onTouched();
    this.close();
  }

  writeValue(value: unknown): void { this.value = value; }
  registerOnChange(fn: (value: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
