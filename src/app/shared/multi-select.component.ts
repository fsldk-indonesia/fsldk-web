import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';

export interface MultiSelectOption {
  value: string | number;
  label: string;
}

/**
 * Dropdown multi-pilih (checkbox list + pill terpilih di trigger + tombol
 * "Terapkan") — dipakai CmsIndexComponent untuk filter Status dan target
 * search-combo mode combobox (Kategori/Role dst). Centang TIDAK langsung
 * menerapkan filter (draft internal), baru commit setelah klik Terapkan;
 * klik di luar popup membatalkan draft (balik ke `selected` terakhir),
 * sama seperti pola dropdown lain di aplikasi ini.
 *
 * Popup dibatasi lebar TRIGGER-nya sendiri (min-width 100% trigger, boleh
 * melebar secukupnya sampai max-width) — bukan lebar penuh container
 * pembungkusnya, beda dari .search-combo-popup versi lama yang melebar
 * sepanjang seluruh search-combo (target-selector + input + tombol).
 */
@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="ms-wrap" #wrap>
      <button type="button" class="ms-trigger" [class.open]="open()" (click)="toggleOpen()">
        @if (selected.length === 0) {
          <span class="ms-placeholder">{{ placeholder }}</span>
        } @else {
          <span class="ms-pills">
            @for (label of selectedLabels().slice(0, 2); track label) {
              <span class="ms-pill">{{ label }}</span>
            }
            @if (selectedLabels().length > 2) {
              <span class="ms-pill ms-pill-more">+{{ selectedLabels().length - 2 }} lainnya</span>
            }
          </span>
        }
        <app-icon class="chevron" name="chevron-down" [size]="10" />
      </button>

      <div class="ms-menu" [class.open]="open()">
        @if (searchable) {
          <input class="ms-search" type="text" placeholder="Cari…" [(ngModel)]="query">
        }
        <div class="ms-options">
          @for (opt of filteredOptions(); track opt.value) {
            <label class="ms-option">
              <input type="checkbox" [checked]="isDraftChecked(opt.value)" (change)="toggleDraft(opt.value)">
              {{ opt.label }}
            </label>
          } @empty {
            <p class="ms-empty">Tidak ditemukan.</p>
          }
        </div>
        <div class="ms-footer">
          <button type="button" class="btn btn-primary btn-sm" (click)="apply()">Terapkan</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ms-wrap { position: relative; }
    .ms-trigger {
      display: flex; align-items: center; gap: 8px; width: 100%; min-height: 42px;
      padding: 8px 12px; border-radius: var(--radius-xs); border: 1px solid var(--color-border);
      background: #fff; font-size: .85rem; color: var(--color-text); cursor: pointer;
      transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .ms-trigger:hover { border-color: var(--color-border-strong); }
    .ms-trigger.open { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .ms-placeholder { color: var(--color-muted); flex: 1; text-align: left; }
    .ms-pills { display: flex; flex-wrap: nowrap; overflow: hidden; gap: 6px; flex: 1; }
    .ms-pill {
      flex-shrink: 0; display: inline-flex; align-items: center; max-width: 160px; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; padding: 3px 9px; border-radius: var(--radius-full);
      background: var(--color-primary-soft); color: var(--color-primary-dark); font-size: .76rem; font-weight: 600;
    }
    .ms-pill-more { background: var(--color-bg-alt); color: var(--color-text-secondary); }
    .ms-trigger .chevron { flex-shrink: 0; font-size: .65rem; color: var(--color-muted); transition: transform .15s ease; }
    .ms-trigger.open .chevron { transform: rotate(180deg); }

    /* Selalu di-render (bukan @if) supaya transisi tutup juga kelihatan —
       sama seperti .dropdown-menu di CmsIndexComponent. Lebar dibatasi ke
       trigger-nya sendiri: minimal selebar trigger, boleh melebar untuk
       label panjang tapi dibatasi max-width, TIDAK melebar ke seluruh
       container pembungkus. */
    .ms-menu {
      position: absolute; top: calc(100% + 6px); left: 0; z-index: 200;
      min-width: 100%; width: max-content; max-width: 300px; max-height: 280px;
      display: flex; flex-direction: column;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-xs); box-shadow: var(--shadow-lg);
      opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(-6px) scale(.97);
      transition: opacity .15s ease, transform .15s ease, visibility 0s linear .15s;
    }
    .ms-menu.open { opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0) scale(1); transition: opacity .15s ease, transform .15s ease, visibility 0s linear 0s; }
    @media (prefers-reduced-motion: reduce) { .ms-menu { transition: none; } }

    .ms-search { flex-shrink: 0; margin: 8px 8px 4px; padding: 7px 10px; border: 1px solid var(--color-border); border-radius: 6px; font-size: .82rem; font-family: var(--font-body); }
    .ms-search:focus { outline: none; border-color: var(--color-primary); }
    .ms-options { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 6px; }
    .ms-option { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 6px; font-size: .85rem; cursor: pointer; }
    .ms-option:hover { background: var(--color-bg-alt); }
    .ms-empty { padding: 10px 8px; font-size: .82rem; color: var(--color-muted); margin: 0; }
    .ms-footer { flex-shrink: 0; padding: 8px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; }
  `],
})
export class MultiSelectComponent implements OnDestroy {
  @Input() options: MultiSelectOption[] = [];
  @Input() selected: (string | number)[] = [];
  @Input() placeholder = 'Semua';
  /** Tampilkan kotak cari-dalam-daftar di atas checkbox — nyalakan untuk daftar panjang (mis. Kategori/Role). */
  @Input() searchable = false;
  @Output() selectedChange = new EventEmitter<(string | number)[]>();
  /** Emit true/false saat popup dibuka/ditutup — dipakai CmsIndexComponent
   *  untuk lazy-load opsi combobox (Kategori/Role dst.) hanya saat pertama
   *  kali dibuka, sama seperti pola onSearchFocus versi lama. */
  @Output() openedChange = new EventEmitter<boolean>();

  open = signal(false);
  query = '';
  private draft: (string | number)[] = [];

  @ViewChild('wrap') private wrap?: ElementRef<HTMLElement>;

  private onDocumentClick = (event: MouseEvent): void => {
    if (this.open() && this.wrap && !this.wrap.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
      this.openedChange.emit(false);
    }
  };

  constructor() { document.addEventListener('click', this.onDocumentClick, true); }
  ngOnDestroy(): void { document.removeEventListener('click', this.onDocumentClick, true); }

  toggleOpen(): void {
    const next = !this.open();
    if (next) { this.draft = [...this.selected]; this.query = ''; }
    this.open.set(next);
    this.openedChange.emit(next);
  }

  isDraftChecked(value: string | number): boolean { return this.draft.includes(value); }
  toggleDraft(value: string | number): void {
    const i = this.draft.indexOf(value);
    if (i >= 0) this.draft.splice(i, 1); else this.draft.push(value);
  }

  filteredOptions(): MultiSelectOption[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.options;
    return this.options.filter((o) => o.label.toLowerCase().includes(q));
  }

  selectedLabels(): string[] {
    return this.options.filter((o) => this.selected.includes(o.value)).map((o) => o.label);
  }

  apply(): void {
    this.selected = [...this.draft];
    this.selectedChange.emit(this.selected);
    this.open.set(false);
    this.openedChange.emit(false);
  }
}
