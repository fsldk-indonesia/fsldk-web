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
      <button type="button" class="app-select-control" [disabled]="disabled"
              (click)="toggle()" (keydown)="onKeydown($event)"
              aria-haspopup="listbox" [attr.aria-expanded]="open()">
        <span [class.placeholder]="!selectedOption()">{{ selectedOption()?.label ?? placeholder }}</span>
        <i class="fas fa-chevron-down"></i>
      </button>
      @if (open()) {
        <ul class="app-select-menu" role="listbox"
            [style.top.px]="pos().top" [style.left.px]="pos().left"
            [style.width.px]="pos().width" [style.maxHeight.px]="pos().maxH">
          @for (opt of options; track opt.value; let i = $index) {
            <li role="option" [attr.aria-selected]="opt.value === value"
                [class.selected]="opt.value === value" [class.active]="i === activeIndex()"
                (mouseenter)="activeIndex.set(i)" (click)="choose(opt)">{{ opt.label }}</li>
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
      position: fixed; z-index: 1000;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-xs);
      box-shadow: var(--shadow-lg); list-style: none; margin: 0; padding: 6px;
      overflow-y: auto; overscroll-behavior: contain;
      display: flex; flex-direction: column; gap: 3px;
    }
    .app-select-menu li { padding: 11px 14px; border-radius: 8px; font-size: .95rem; color: var(--color-text); cursor: pointer; }
    .app-select-menu li:hover { background: var(--color-bg-alt); }
    .app-select-menu li.active { background: var(--color-bg-alt); }
    .app-select-menu li.selected { background: var(--color-primary-soft); color: var(--color-primary-dark); font-weight: 600; }
    .app-select-menu li.selected.active { background: var(--color-primary); color: #fff; }
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
  activeIndex = signal(-1); // keyboard-highlighted option
  pos = signal({ top: 0, left: 0, width: 0, maxH: 240 });

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
    const sel = this.options.findIndex((o) => o.value === this.value);
    this.activeIndex.set(sel >= 0 ? sel : 0);
    this.open.set(true);
    // Keep focus on the trigger so arrow keys / Enter reach onKeydown even when
    // the menu was opened by something other than a real focusing click.
    (this.el.nativeElement.querySelector('.app-select-control') as HTMLElement | null)?.focus();
    this.scrollActiveIntoView();
  }

  private close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
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
        if (this.open()) { event.preventDefault(); this.setActive(this.options.length - 1); }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.open()) {
          const opt = this.options[this.activeIndex()];
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
    const n = this.options.length;
    if (n === 0) return;
    this.setActive(Math.min(n - 1, Math.max(0, this.activeIndex() + delta)));
  }

  private setActive(i: number): void {
    this.activeIndex.set(i);
    this.scrollActiveIntoView();
  }

  private scrollActiveIntoView(): void {
    setTimeout(() => {
      const items = this.el.nativeElement.querySelectorAll('.app-select-menu li');
      (items[this.activeIndex()] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
    });
  }

  /** Place the fixed menu below the control, or above it when space is short. */
  private reposition(): void {
    const r = this.el.nativeElement.getBoundingClientRect();
    const gap = 6;
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
