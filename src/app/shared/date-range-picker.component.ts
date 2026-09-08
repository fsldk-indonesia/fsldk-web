import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, inject, signal } from '@angular/core';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface RangeCell {
  date: Date;
  dayNum: number;
  isOtherMonth: boolean;
  isToday: boolean;
  isStart: boolean;
  isEnd: boolean;
  inRange: boolean;
}

export interface DateRange { from: string; to: string; }

/**
 * Popup rentang tanggal dua-kalender berdampingan (bulan aktif & bulan
 * berikutnya, geser bersamaan) — dipakai filter kolom "Tanggal" index CMS.
 * Beda dari DateTimePickerComponent (satu tanggal, tanpa opsi rentang):
 * dibuat komponen terpisah supaya DateTimePickerComponent yang sudah dipakai
 * luas (form Event/Jadwal/dst.) tidak perlu dibebani mode rentang yang cuma
 * relevan untuk filter tabel.
 */
@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  template: `
    <div class="drp-wrap" [class.open]="open()">
      <button type="button" class="drp-trigger" (click)="toggle()" aria-haspopup="dialog" [attr.aria-expanded]="open()">
        <span class="drp-icon"><i class="fas fa-calendar-alt"></i></span>
        <span class="drp-text" [class.placeholder]="!from && !to">{{ displayValue() }}</span>
      </button>

      @if (open()) {
        <div class="drp-panel" [class.dropup]="dropup()" [class.align-right]="alignRight()" role="dialog">
          <div class="drp-months">
            @for (m of [0, 1]; track m) {
              <div class="drp-month">
                <div class="drp-cal-header">
                  @if (m === 0) {
                    <button type="button" class="drp-nav" (click)="prevMonth()"><i class="fas fa-chevron-left"></i></button>
                  } @else {
                    <span class="drp-nav-spacer"></span>
                  }
                  <span class="drp-caption">{{ monthLabel(m) }}</span>
                  @if (m === 1) {
                    <button type="button" class="drp-nav" (click)="nextMonth()"><i class="fas fa-chevron-right"></i></button>
                  } @else {
                    <span class="drp-nav-spacer"></span>
                  }
                </div>
                <div class="drp-weekdays">
                  @for (w of weekdays; track w) { <span>{{ w }}</span> }
                </div>
                <div class="drp-grid">
                  @for (c of cells(m); track c.date.getTime()) {
                    <div class="drp-cell"
                         [class.other-month]="c.isOtherMonth"
                         [class.today]="c.isToday"
                         [class.range-start]="c.isStart"
                         [class.range-end]="c.isEnd"
                         [class.in-range]="c.inRange"
                         (click)="pickDay(c.date)">
                      {{ c.dayNum }}
                    </div>
                  }
                </div>
              </div>
            }
          </div>
          <div class="drp-footer">
            <button type="button" class="drp-btn drp-btn-clear" (click)="clear()">Hapus</button>
            <span class="drp-hint">{{ pendingFrom && !pendingTo ? 'Pilih tanggal akhir…' : 'Pilih tanggal mulai' }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .drp-wrap { position: relative; }
    .drp-trigger {
      display: flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: var(--radius-xs);
      border: 1px solid var(--color-border); background: #fff; font-family: var(--font-body); font-size: .88rem;
      color: var(--color-text); cursor: pointer; white-space: nowrap; transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
    }
    .drp-wrap.open .drp-trigger { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-soft); }
    .drp-icon { color: var(--color-muted); font-size: .85rem; }
    .drp-text.placeholder { color: var(--color-muted); }

    .drp-panel {
      position: absolute; top: calc(100% + 6px); left: 0; z-index: 300;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-xs); box-shadow: var(--shadow-lg);
      padding: 10px; animation: drpSlideDown .15s ease;
    }
    .drp-panel.dropup { top: auto; bottom: calc(100% + 6px); }
    .drp-panel.align-right { left: auto; right: 0; }
    @keyframes drpSlideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

    .drp-months { display: flex; gap: 14px; }
    .drp-month { width: 220px; }
    .drp-cal-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px; }
    .drp-caption { font-size: .82rem; font-weight: 700; color: var(--color-text); }
    .drp-nav { width: 26px; height: 26px; border: none; background: transparent; border-radius: 6px; color: var(--color-muted); cursor: pointer; font-size: .7rem; }
    .drp-nav:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .drp-nav-spacer { width: 26px; height: 26px; }

    .drp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); padding: 2px 0; }
    .drp-weekdays span { text-align: center; font-size: .64rem; font-weight: 700; color: var(--color-muted); text-transform: uppercase; }

    .drp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
    .drp-cell {
      aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
      font-size: .78rem; font-weight: 500; cursor: pointer; color: var(--color-text); user-select: none;
      transition: background .1s, color .1s;
    }
    .drp-cell:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .drp-cell.other-month { color: var(--color-muted); opacity: .4; }
    .drp-cell.today { font-weight: 800; text-decoration: underline; }
    .drp-cell.in-range { background: var(--color-primary-soft); border-radius: 0; }
    .drp-cell.range-start, .drp-cell.range-end { background: var(--color-primary) !important; color: #fff !important; font-weight: 700; border-radius: 6px; }

    .drp-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; margin-top: 6px; border-top: 1px solid var(--color-border); }
    .drp-btn { border: none; background: transparent; cursor: pointer; font-size: .78rem; font-weight: 600; padding: 4px 8px; border-radius: 6px; }
    .drp-btn-clear { color: var(--color-muted); }
    .drp-btn-clear:hover { background: rgba(0,0,0,.05); color: var(--color-text); }
    .drp-hint { font-size: .74rem; color: var(--color-muted); }
  `],
})
export class DateRangePickerComponent implements OnDestroy {
  private el = inject(ElementRef<HTMLElement>);

  @Input() from = '';
  @Input() to = '';
  @Input() placeholder = 'Pilih rentang tanggal';
  @Output() rangeChange = new EventEmitter<DateRange>();

  open = signal(false);
  dropup = signal(false);
  alignRight = signal(false);
  viewMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  readonly weekdays = WEEKDAYS;
  readonly today = new Date();

  pendingFrom: Date | null = null;
  pendingTo: Date | null = null;

  constructor() {
    document.addEventListener('click', this.onDocumentClick, true);
  }
  ngOnDestroy(): void { document.removeEventListener('click', this.onDocumentClick, true); }

  private onDocumentClick = (event: MouseEvent): void => {
    if (this.open() && !this.el.nativeElement.contains(event.target as Node)) this.close();
  };

  toggle(): void { this.open() ? this.close() : this.show(); }

  show(): void {
    this.pendingFrom = this.parse(this.from);
    this.pendingTo = this.parse(this.to);
    this.viewMonth = this.pendingFrom ? new Date(this.pendingFrom.getFullYear(), this.pendingFrom.getMonth(), 1) : new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    const rect = this.el.nativeElement.getBoundingClientRect();
    const panelWidth = 470; // ~2 kalender berdampingan + gap + padding (lihat .drp-panel/.drp-months)
    this.dropup.set(window.innerHeight - rect.bottom < 320);
    this.alignRight.set(rect.left + panelWidth > window.innerWidth - 16);
    this.open.set(true);
  }

  close(): void { this.open.set(false); }

  prevMonth(): void { this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() - 1, 1); }
  nextMonth(): void { this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + 1, 1); }

  monthLabel(offset: number): string {
    const d = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + offset, 1);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  cells(offset: number): RangeCell[] {
    const base = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + offset, 1);
    const y = base.getFullYear();
    const m = base.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrev = new Date(y, m, 0).getDate();

    const cells: RangeCell[] = [];
    const push = (date: Date, isOtherMonth: boolean) => {
      cells.push({
        date, dayNum: date.getDate(), isOtherMonth,
        isToday: this.isSameDay(date, this.today),
        isStart: !!this.pendingFrom && this.isSameDay(date, this.pendingFrom),
        isEnd: !!this.pendingTo && this.isSameDay(date, this.pendingTo),
        inRange: this.isInRange(date),
      });
    };

    for (let i = firstDay - 1; i >= 0; i--) push(new Date(y, m - 1, daysInPrev - i), true);
    for (let d = 1; d <= daysInMonth; d++) push(new Date(y, m, d), false);
    const total = firstDay + daysInMonth;
    const trail = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let t = 1; t <= trail; t++) push(new Date(y, m + 1, t), true);

    return cells;
  }

  private isInRange(d: Date): boolean {
    if (!this.pendingFrom || !this.pendingTo) return false;
    return d.getTime() > this.pendingFrom.getTime() && d.getTime() < this.pendingTo.getTime();
  }

  pickDay(d: Date): void {
    if (!this.pendingFrom || (this.pendingFrom && this.pendingTo)) {
      this.pendingFrom = d;
      this.pendingTo = null;
      return;
    }
    if (d.getTime() < this.pendingFrom.getTime()) {
      this.pendingTo = this.pendingFrom;
      this.pendingFrom = d;
    } else {
      this.pendingTo = d;
    }
    this.from = this.format(this.pendingFrom);
    this.to = this.format(this.pendingTo);
    this.rangeChange.emit({ from: this.from, to: this.to });
    this.close();
  }

  clear(): void {
    this.pendingFrom = null; this.pendingTo = null;
    this.from = ''; this.to = '';
    this.rangeChange.emit({ from: '', to: '' });
    this.close();
  }

  displayValue(): string {
    if (!this.from && !this.to) return this.placeholder;
    const f = this.from ? this.formatDisplay(this.from) : '…';
    const t = this.to ? this.formatDisplay(this.to) : '…';
    return `${f} → ${t}`;
  }

  private formatDisplay(iso: string): string {
    const d = this.parse(iso);
    if (!d) return iso;
    return `${this.pad(d.getDate())}-${this.pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  }

  private format(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  }

  private pad(n: number): string { return String(n).padStart(2, '0'); }

  private parse(val: string): Date | null {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
}
