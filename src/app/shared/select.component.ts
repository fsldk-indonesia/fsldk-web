import { Component, ElementRef, Input, OnDestroy, forwardRef, inject, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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
  template: `
    <div class="app-select" [class.open]="open()" [class.disabled]="disabled">
      <button type="button" class="app-select-control" (click)="toggle()" [disabled]="disabled" (keydown.escape)="open.set(false)">
        <span [class.placeholder]="!selectedOption()">{{ selectedOption()?.label ?? placeholder }}</span>
        <i class="fas fa-chevron-down"></i>
      </button>
      @if (open()) {
        <ul class="app-select-menu" role="listbox">
          @for (opt of options; track opt.value) {
            <li role="option" [class.selected]="opt.value === value" (click)="choose(opt)">{{ opt.label }}</li>
          } @empty {
            <li class="empty">Tidak ada pilihan</li>
          }
        </ul>
      }
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
    .app-select-menu {
      position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 50;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-xs);
      box-shadow: var(--shadow-lg); list-style: none; margin: 0; padding: 6px; max-height: 240px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 3px;
    }
    .app-select-menu li { padding: 11px 14px; border-radius: 8px; font-size: .95rem; color: var(--color-text); cursor: pointer; }
    .app-select-menu li:hover { background: var(--color-bg-alt); }
    .app-select-menu li.selected { background: var(--color-primary-soft); color: var(--color-primary-dark); font-weight: 600; }
    .app-select-menu li.empty { color: var(--color-muted); cursor: default; }
    .app-select-menu li.empty:hover { background: none; }
  `],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectComponent), multi: true }],
})
export class SelectComponent implements ControlValueAccessor, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);

  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Pilih…';
  @Input() disabled = false;

  value: unknown = null;
  open = signal(false);

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

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
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick, true);
  }

  selectedOption(): SelectOption | undefined {
    return this.options.find((o) => o.value === this.value);
  }

  toggle(): void {
    if (!this.disabled) this.open.update((v) => !v);
  }

  choose(opt: SelectOption): void {
    this.value = opt.value;
    this.onChange(this.value);
    this.onTouched();
    this.open.set(false);
  }

  writeValue(value: unknown): void { this.value = value; }
  registerOnChange(fn: (value: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
