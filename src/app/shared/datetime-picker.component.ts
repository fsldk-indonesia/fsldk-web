import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface DayCell {
  date: Date;
  dayNum: number;
  isOtherMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

/**
 * Custom DateTime / Date Picker bergaya ldksyahid-app:
 * - Trigger box dengan format tanggal yang user-friendly (DD/MM/YYYY HH:mm).
 * - Floating panel dengan smart auto-position (top/bottom).
 * - 3 mode kalender: Hari (Day), Bulan (Month 3x4), dan Tahun (Year scrollable).
 * - Pemilih waktu dual-column (Jam & Menit) yang scrollable secara mandiri.
 * - Tombol aksi cepat 'Hapus' dan 'Sekarang / Hari ini'.
 * - Mendukung ControlValueAccessor ([(ngModel)]).
 */
@Component({
  selector: 'app-datetime-picker',
  standalone: true,
  template: `
    <div class="dtp-wrap" [class.open]="open()" [class.disabled]="disabled">
      <!-- Trigger -->
      <button
        type="button"
        class="dtp-trigger"
        [disabled]="disabled"
        (click)="toggle()"
        (keydown.escape)="close()"
        aria-haspopup="dialog"
        [attr.aria-expanded]="open()">
        <span class="dtp-text" [class.placeholder]="!value">
          {{ displayValue() }}
        </span>
        <span class="dtp-icon"><i class="fas fa-calendar-alt"></i></span>
      </button>

      <!-- Panel -->
      @if (open()) {
        <div class="dtp-panel" [class.dropup]="isDropup()" role="dialog">
          <!-- Calendar Header -->
          <div class="dtp-cal-header">
            <button
              type="button"
              class="dtp-nav"
              [disabled]="mode() === 'year'"
              [style.visibility]="mode() === 'year' ? 'hidden' : 'visible'"
              (click)="prevMonth()">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button type="button" class="dtp-caption-btn" (click)="toggleMode()">
              <span>{{ headerCaption() }}</span>
              <i class="fas fa-chevron-down dtp-caption-arrow" [class.rotated]="mode() !== 'day'"></i>
            </button>
            <button
              type="button"
              class="dtp-nav"
              [disabled]="mode() === 'year'"
              [style.visibility]="mode() === 'year' ? 'hidden' : 'visible'"
              (click)="nextMonth()">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>

          <!-- Mode: Day View -->
          @if (mode() === 'day') {
            <div class="dtp-weekdays">
              @for (w of weekdays; track w) {
                <span>{{ w }}</span>
              }
            </div>
            <div class="dtp-grid">
              @for (c of dayCells(); track c.date.getTime()) {
                <div
                  class="dtp-cell"
                  [class.other-month]="c.isOtherMonth"
                  [class.today]="c.isToday"
                  [class.selected]="c.isSelected"
                  (click)="pickDay(c.date)">
                  {{ c.dayNum }}
                </div>
              }
            </div>
          }

          <!-- Mode: Month View (3x4) -->
          @if (mode() === 'month') {
            <div class="dtp-month-grid">
              @for (m of monthsShort; track $index) {
                <div
                  class="dtp-month-cell"
                  [class.cur-month]="isCurrentMonth($index)"
                  [class.sel-month]="isSelectedMonth($index)"
                  (click)="pickMonth($index)">
                  {{ m }}
                </div>
              }
            </div>
          }

          <!-- Mode: Year View (Scrollable) -->
          @if (mode() === 'year') {
            <div class="dtp-year-grid" #yearContainer>
              @for (y of yearList; track y) {
                <div
                  class="dtp-year-cell"
                  [class.cur-year]="y === currentYear"
                  [class.sel-year]="y === selectedYear()"
                  (click)="pickYear(y)">
                  {{ y }}
                </div>
              }
            </div>
          }

          <!-- Time Section (Optional / Default for DateTime) -->
          @if (showTime && mode() === 'day') {
            <div class="dtp-time-section">
              <div class="dtp-time-label">Waktu</div>
              <div class="dtp-time-cols">
                <!-- Hour Column -->
                <div class="dtp-col-wrap">
                  <div class="dtp-col-label">Jam</div>
                  <div class="dtp-col" #hourCol>
                    @for (h of hours; track h) {
                      <div
                        class="dtp-time-item"
                        [class.selected]="selectedHour() === h"
                        (click)="pickHour(h)">
                        {{ pad(h) }}
                      </div>
                    }
                  </div>
                </div>

                <div class="dtp-time-sep">:</div>

                <!-- Minute Column -->
                <div class="dtp-col-wrap">
                  <div class="dtp-col-label">Menit</div>
                  <div class="dtp-col" #minCol>
                    @for (m of minutes; track m) {
                      <div
                        class="dtp-time-item"
                        [class.selected]="selectedMinute() === m"
                        (click)="pickMinute(m)">
                        {{ pad(m) }}
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Footer Actions -->
          <div class="dtp-footer">
            <button type="button" class="dtp-btn dtp-btn-clear" (click)="clear()">Hapus</button>
            <button type="button" class="dtp-btn dtp-btn-now" (click)="setNow()">
              {{ showTime ? 'Sekarang' : 'Hari ini' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dtp-wrap { position: relative; width: 100%; }

    /* Trigger Button */
    .dtp-trigger {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 10px 14px; min-height: 44px;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-xs, 8px);
      font-family: var(--font-body); font-size: .95rem; color: var(--color-text);
      cursor: pointer; text-align: left; transition: border-color var(--motion-fast) ease, box-shadow var(--motion-fast) ease;
      user-select: none;
    }
    .dtp-trigger:hover:not(:disabled) { border-color: var(--color-primary-dark); }
    .dtp-wrap.open .dtp-trigger {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
      outline: none;
    }
    .dtp-wrap.disabled .dtp-trigger {
      background: var(--color-bg-alt); color: var(--color-muted); cursor: not-allowed; opacity: .7;
    }
    .dtp-text {
      flex: 1; line-height: 1.4; font-variant-numeric: tabular-nums;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .dtp-text.placeholder { color: var(--color-muted, #9aa0a6); }
    .dtp-icon { color: var(--color-muted); font-size: .9rem; flex-shrink: 0; line-height: 1; }

    /* Floating Panel */
    .dtp-panel {
      position: absolute; top: calc(100% + 6px); left: 0;
      background: #fff; border: 1px solid var(--color-border); border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.06);
      z-index: 300; width: 284px; max-width: calc(100vw - 2rem); overflow: hidden;
      animation: dtpSlideDown .15s ease;
    }
    .dtp-panel.dropup {
      top: auto; bottom: calc(100% + 6px);
      animation: dtpSlideUp .15s ease;
    }

    @keyframes dtpSlideDown {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes dtpSlideUp {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Header */
    .dtp-cal-header {
      display: flex; align-items: center; justify-content: space-between; gap: 4px;
      padding: 10px 8px 8px; border-bottom: 1px solid var(--color-border);
    }
    .dtp-caption-btn {
      flex: 1; border: none; background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      font-size: .88rem; font-weight: 700; color: var(--color-text);
      padding: 5px 8px; border-radius: 6px; transition: background .12s;
      font-family: inherit; line-height: 1.2;
    }
    .dtp-caption-btn:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .dtp-caption-arrow {
      font-size: .65rem; color: var(--color-muted); transition: transform .2s ease;
    }
    .dtp-caption-arrow.rotated { transform: rotate(180deg); }

    .dtp-nav {
      width: 30px; height: 30px; border: none; background: transparent;
      cursor: pointer; border-radius: 6px; color: var(--color-muted);
      font-size: .75rem; display: flex; align-items: center; justify-content: center;
      transition: background .12s, color .12s; flex-shrink: 0; padding: 0;
    }
    .dtp-nav:hover:not(:disabled) { background: var(--color-primary-soft); color: var(--color-primary-dark); }

    /* Weekday Labels */
    .dtp-weekdays {
      display: grid; grid-template-columns: repeat(7, 1fr); padding: 8px 8px 2px;
    }
    .dtp-weekdays span {
      text-align: center; font-size: .68rem; font-weight: 700;
      color: var(--color-muted); text-transform: uppercase; letter-spacing: .03em;
    }

    /* Day Grid */
    .dtp-grid {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; padding: 4px 8px 8px;
    }
    .dtp-cell {
      aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
      font-size: .84rem; font-weight: 500; border-radius: 6px;
      cursor: pointer; transition: background .12s, color .12s;
      color: var(--color-text); user-select: none;
    }
    .dtp-cell:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .dtp-cell.other-month { color: var(--color-muted); opacity: .4; }
    .dtp-cell.other-month:hover { opacity: .8; }
    .dtp-cell.today { border: 1.5px solid var(--color-primary); color: var(--color-primary-dark); font-weight: 700; }
    .dtp-cell.selected { background: var(--color-primary) !important; color: #fff !important; font-weight: 700; border: none; }

    /* Month Grid (3x4) */
    .dtp-month-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 10px 8px;
    }
    .dtp-month-cell {
      text-align: center; padding: 10px 4px; border-radius: 8px;
      cursor: pointer; font-size: .85rem; font-weight: 500;
      color: var(--color-text); transition: background .12s, color .12s; user-select: none;
    }
    .dtp-month-cell:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .dtp-month-cell.cur-month { color: var(--color-primary-dark); font-weight: 700; }
    .dtp-month-cell.sel-month { background: var(--color-primary); color: #fff; font-weight: 700; }

    /* Year Grid (Scrollable) */
    .dtp-year-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 8px;
      max-height: 200px; overflow-y: auto; scrollbar-width: thin;
    }
    .dtp-year-grid::-webkit-scrollbar { width: 4px; }
    .dtp-year-grid::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
    .dtp-year-cell {
      text-align: center; padding: 8px 2px; border-radius: 6px;
      cursor: pointer; font-size: .82rem; font-weight: 500;
      color: var(--color-text); transition: background .12s, color .12s; user-select: none;
    }
    .dtp-year-cell:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .dtp-year-cell.cur-year { color: var(--color-primary-dark); font-weight: 700; }
    .dtp-year-cell.sel-year { background: var(--color-primary); color: #fff; font-weight: 700; }

    /* Time Section */
    .dtp-time-section {
      border-top: 1px solid var(--color-border); padding: 0 8px 6px;
    }
    .dtp-time-label {
      font-size: .65rem; font-weight: 700; color: var(--color-muted);
      text-transform: uppercase; letter-spacing: .05em; padding: 6px 0 2px;
    }
    .dtp-time-cols { display: flex; align-items: stretch; }
    .dtp-col-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .dtp-col-label {
      text-align: center; font-size: .62rem; font-weight: 700;
      color: var(--color-muted); text-transform: uppercase; letter-spacing: .04em; padding: 2px 0 4px;
    }
    .dtp-time-sep {
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 700; color: var(--color-muted);
      padding: 16px 4px 0; flex-shrink: 0;
    }
    .dtp-col {
      max-height: 110px; overflow-y: auto; scrollbar-width: thin;
      padding-right: 2px;
    }
    .dtp-col::-webkit-scrollbar { width: 3px; }
    .dtp-col::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
    .dtp-time-item {
      text-align: center; padding: 5px 4px; font-size: .88rem; font-weight: 500;
      color: var(--color-text); cursor: pointer; border-radius: 6px;
      transition: background .12s, color .12s; user-select: none; font-variant-numeric: tabular-nums;
    }
    .dtp-time-item:hover { background: var(--color-primary-soft); color: var(--color-primary-dark); }
    .dtp-time-item.selected { background: var(--color-primary); color: #fff; font-weight: 700; }

    /* Footer */
    .dtp-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; border-top: 1px solid var(--color-border); background: #fafbfc;
    }
    .dtp-btn {
      border: none; background: transparent; cursor: pointer;
      font-size: .8rem; font-weight: 600; padding: 4px 8px;
      border-radius: 6px; transition: background .12s, color .12s; font-family: inherit;
    }
    .dtp-btn-clear { color: var(--color-muted); }
    .dtp-btn-clear:hover { background: rgba(0,0,0,.05); color: var(--color-text); }
    .dtp-btn-now { color: var(--color-primary-dark); font-weight: 700; }
    .dtp-btn-now:hover { background: var(--color-primary-soft); }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimePickerComponent),
      multi: true,
    },
  ],
})
export class DateTimePickerComponent implements OnInit, ControlValueAccessor, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);

  @Input() placeholder = 'dd/mm/yyyy --:--';
  @Input() showTime = true;
  @Input() disabled = false;

  value = ''; // format: YYYY-MM-DDTHH:mm or YYYY-MM-DD
  open = signal(false);
  isDropup = signal(false);
  mode = signal<'day' | 'month' | 'year'>('day');

  // Calendar View state
  viewDate = new Date();
  readonly today = new Date();
  readonly currentYear = new Date().getFullYear();

  readonly weekdays = WEEKDAYS;
  readonly monthsShort = MONTHS_SHORT;
  readonly hours = Array.from({ length: 24 }, (_, i) => i);
  readonly minutes = Array.from({ length: 60 }, (_, i) => i);
  readonly yearList: number[] = [];

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const endYear = this.currentYear + 10;
    for (let y = this.currentYear - 80; y <= endYear; y++) {
      this.yearList.push(y);
    }
    document.addEventListener('click', this.onDocumentClick, true);
  }

  ngOnInit(): void {
    if (!this.showTime && this.placeholder === 'dd/mm/yyyy --:--') {
      this.placeholder = 'Pilih tanggal…';
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick, true);
  }

  private onDocumentClick = (event: MouseEvent): void => {
    if (this.open() && !this.el.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  };

  toggle(): void {
    if (this.disabled) return;
    if (this.open()) {
      this.close();
    } else {
      this.show();
    }
  }

  show(): void {
    this.mode.set('day');
    const parsed = this.parseDate(this.value);
    this.viewDate = parsed ? new Date(parsed) : new Date();
    this.viewDate.setDate(1);

    // Calculate position
    const rect = this.el.nativeElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    this.isDropup.set(spaceBelow < 360);

    this.open.set(true);

    // Auto scroll time columns after rendering
    setTimeout(() => this.scrollTimeToSelected(), 20);
  }

  close(): void {
    this.open.set(false);
    this.mode.set('day');
  }

  toggleMode(): void {
    if (this.mode() === 'day') {
      this.mode.set('month');
    } else if (this.mode() === 'month') {
      this.mode.set('year');
      setTimeout(() => this.scrollYearToSelected(), 20);
    } else {
      this.mode.set('day');
    }
  }

  headerCaption(): string {
    const m = this.viewDate.getMonth();
    const y = this.viewDate.getFullYear();
    if (this.mode() === 'day') return `${MONTHS[m]} ${y}`;
    if (this.mode() === 'month') return `${y}`;
    return 'Pilih Tahun';
  }

  prevMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
  }

  nextMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
  }

  dayCells(): DayCell[] {
    const y = this.viewDate.getFullYear();
    const m = this.viewDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay(); // 0 = Min, 1 = Sen
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrev = new Date(y, m, 0).getDate();

    const cells: DayCell[] = [];
    const selDate = this.parseDate(this.value);

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(y, m - 1, daysInPrev - i);
      cells.push({
        date: d,
        dayNum: d.getDate(),
        isOtherMonth: true,
        isToday: this.isSameDay(d, this.today),
        isSelected: !!selDate && this.isSameDay(d, selDate),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      cells.push({
        date,
        dayNum: d,
        isOtherMonth: false,
        isToday: this.isSameDay(date, this.today),
        isSelected: !!selDate && this.isSameDay(date, selDate),
      });
    }

    // Trailing next month days
    const total = firstDay + daysInMonth;
    const trail = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let t = 1; t <= trail; t++) {
      const d = new Date(y, m + 1, t);
      cells.push({
        date: d,
        dayNum: d.getDate(),
        isOtherMonth: true,
        isToday: this.isSameDay(d, this.today),
        isSelected: !!selDate && this.isSameDay(d, selDate),
      });
    }

    return cells;
  }

  pickDay(d: Date): void {
    const current = this.parseDate(this.value) || new Date();
    const h = this.showTime ? current.getHours() : 0;
    const min = this.showTime ? current.getMinutes() : 0;

    const newDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, min);
    this.updateValue(newDate);

    if (!this.showTime) {
      this.close();
    }
  }

  pickMonth(mIndex: number): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), mIndex, 1);
    this.mode.set('day');
  }

  pickYear(year: number): void {
    this.viewDate = new Date(year, this.viewDate.getMonth(), 1);
    this.mode.set('month');
  }

  pickHour(h: number): void {
    const current = this.parseDate(this.value) || new Date();
    const newDate = new Date(current.getFullYear(), current.getMonth(), current.getDate(), h, current.getMinutes());
    this.updateValue(newDate);
  }

  pickMinute(m: number): void {
    const current = this.parseDate(this.value) || new Date();
    const newDate = new Date(current.getFullYear(), current.getMonth(), current.getDate(), current.getHours(), m);
    this.updateValue(newDate);
  }

  selectedHour(): number {
    const d = this.parseDate(this.value);
    return d ? d.getHours() : 0;
  }

  selectedMinute(): number {
    const d = this.parseDate(this.value);
    return d ? d.getMinutes() : 0;
  }

  selectedYear(): number | null {
    const d = this.parseDate(this.value);
    return d ? d.getFullYear() : null;
  }

  isCurrentMonth(mIndex: number): boolean {
    return mIndex === this.today.getMonth() && this.viewDate.getFullYear() === this.today.getFullYear();
  }

  isSelectedMonth(mIndex: number): boolean {
    const d = this.parseDate(this.value);
    return !!d && mIndex === d.getMonth() && this.viewDate.getFullYear() === d.getFullYear();
  }

  setNow(): void {
    const now = new Date();
    this.updateValue(now);
    this.viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.close();
  }

  clear(): void {
    this.value = '';
    this.onChange('');
    this.onTouched();
    this.close();
  }

  displayValue(): string {
    if (!this.value) return this.placeholder;
    const d = this.parseDate(this.value);
    if (!d) return this.value;

    const day = this.pad(d.getDate());
    const mon = this.pad(d.getMonth() + 1);
    const yr = d.getFullYear();

    if (!this.showTime) {
      return `${day}/${mon}/${yr}`;
    }

    const hr = this.pad(d.getHours());
    const min = this.pad(d.getMinutes());
    return `${day}/${mon}/${yr} ${hr}:${min}`;
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  private updateValue(d: Date): void {
    const y = d.getFullYear();
    const m = this.pad(d.getMonth() + 1);
    const day = this.pad(d.getDate());

    if (!this.showTime) {
      this.value = `${y}-${m}-${day}`;
    } else {
      const hr = this.pad(d.getHours());
      const min = this.pad(d.getMinutes());
      this.value = `${y}-${m}-${day}T${hr}:${min}`;
    }

    this.onChange(this.value);
    this.onTouched();
  }

  private parseDate(val: string): Date | null {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private scrollYearToSelected(): void {
    const container = this.el.nativeElement.querySelector('.dtp-year-grid');
    if (!container) return;
    const sel = container.querySelector('.sel-year') || container.querySelector('.cur-year');
    if (sel) sel.scrollIntoView({ block: 'center' });
  }

  private scrollTimeToSelected(): void {
    const hourCol = this.el.nativeElement.querySelector('.dtp-time-cols .dtp-col:first-of-type');
    const minCol = this.el.nativeElement.querySelector('.dtp-time-cols .dtp-col:last-of-type');
    if (hourCol) {
      const sel = hourCol.querySelector('.selected');
      if (sel) sel.scrollIntoView({ block: 'center' });
    }
    if (minCol) {
      const sel = minCol.querySelector('.selected');
      if (sel) sel.scrollIntoView({ block: 'center' });
    }
  }

  // ControlValueAccessor
  writeValue(value: string): void {
    this.value = value ? value.substring(0, 16) : '';
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
