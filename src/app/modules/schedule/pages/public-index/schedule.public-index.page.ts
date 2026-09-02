import { Component, OnInit, inject, signal } from '@angular/core';
import { IconComponent } from '../../../../shared/icon.component';
import { Schedule } from '../../entities/schedule';
import {
  DAYS_ID_SHORT, ScheduleCategoryMeta, categoryMeta,
  formatDateRange, formatLongDate, formatTimeRange, monthName,
} from '../../schedule.constants';
import { SchedulePublicIndexPresenter } from './schedule.public-index.presenter';
import { CalendarCell, SchedulePublicIndexView } from './schedule.public-index.view';

@Component({
  selector: 'app-schedule-public-index-page',
  standalone: true,
  templateUrl: './schedule.public-index.page.html',
  imports: [IconComponent],
  providers: [SchedulePublicIndexPresenter],
  styles: [`
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 200px, #fff 460px); }
    .cal-head { margin-bottom: 24px; }
    .cal-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; margin-bottom: 18px; }
    .cal-period { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; min-width: 190px; text-align: center; }
    .nav-btn { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; font-size: 1.2rem; line-height: 1; }
    .cal-error { max-width: 640px; margin: 0 auto 16px; padding: 12px 16px; border-radius: var(--radius-md); background: #fdecec; color: #b42318; display: flex; gap: 12px; align-items: center; justify-content: center; font-size: .9rem; }

    .cal-wrap { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 10px; box-shadow: var(--shadow); }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .cal-dow-cell { padding: 8px 6px; text-align: center; font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--color-muted); }
    .cal-cell {
      position: relative; min-height: 104px; padding: 6px; border: 1px solid var(--color-border);
      margin: -0.5px; display: flex; flex-direction: column; gap: 4px; background: #fff;
    }
    .cal-cell.out { background: var(--color-bg-alt); }
    .cal-cell.out .cal-date { color: var(--color-muted); }
    .cal-cell.has { cursor: pointer; }
    .cal-cell:hover, .cal-cell:focus-within, .cal-cell:focus { z-index: 30; outline: none; }
    .cal-cell.has:hover { box-shadow: inset 0 0 0 2px var(--color-primary); }
    .cal-cell:focus-visible { box-shadow: inset 0 0 0 2px var(--color-primary); }
    .cal-date { font-size: .82rem; font-weight: 600; color: var(--color-text-secondary); }
    .cal-cell.today .cal-date { background: var(--color-primary); color: #fff; border-radius: var(--radius-full); width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; }
    .cal-chips { display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
    .cal-chip { display: flex; align-items: center; gap: 5px; font-size: .72rem; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text); }
    .cal-chip .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .cal-more { font-size: .68rem; color: var(--color-muted); }

    .cal-pop {
      position: absolute; top: calc(100% - 2px); left: -1px; width: 288px; max-width: 78vw; z-index: 40;
      background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg); padding: 12px 14px; text-align: left; cursor: default;
    }
    .cal-cell:nth-child(7n) .cal-pop, .cal-cell:nth-child(7n-1) .cal-pop { left: auto; right: -1px; }
    .cal-pop-date { margin: 0 0 8px; font-weight: 700; font-size: .85rem; }
    .cal-pop ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .cal-pop li { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: .8rem; }
    .cal-pop-time { font-variant-numeric: tabular-nums; color: var(--color-primary-dark); font-weight: 600; }
    .cal-pop-title { font-weight: 600; }
    .cal-pop-loc { display: inline-flex; align-items: center; gap: 4px; color: var(--color-muted); width: 100%; }
    .cat-badge { display: inline-block; padding: 1px 8px; border-radius: var(--radius-full); font-size: .68rem; font-weight: 700; }

    .agenda { max-width: 760px; margin: 40px auto 0; }
    .agenda > h2 { font-size: 1.15rem; margin-bottom: 14px; }
    .agenda-item { display: flex; gap: 16px; padding: 16px 0; border-top: 1px solid var(--color-border); }
    .agenda-when { flex: 0 0 132px; }
    .agenda-date { display: block; font-weight: 700; font-size: .9rem; }
    .agenda-time { display: block; font-size: .82rem; color: var(--color-muted); font-variant-numeric: tabular-nums; }
    .agenda-body h3 { margin: 6px 0 4px; font-size: 1rem; }
    .agenda-desc { color: var(--color-text-secondary); font-size: .88rem; margin: 4px 0; white-space: pre-line; }
    .agenda-meta { display: flex; flex-wrap: wrap; gap: 14px; color: var(--color-muted); font-size: .82rem; margin: 6px 0 10px; }
    .agenda-meta span { display: inline-flex; align-items: center; gap: 5px; }

    @media (max-width: 640px) {
      .cal-wrap { display: none; }
      .agenda { margin-top: 8px; }
      .agenda-item { flex-direction: column; gap: 6px; }
      .agenda-when { flex-basis: auto; }
    }
  `],
})
export class SchedulePublicIndexPage implements OnInit, SchedulePublicIndexView {
  private presenter = inject(SchedulePublicIndexPresenter);

  readonly dow = DAYS_ID_SHORT;
  readonly skeletonCells = Array.from({ length: 42 }, (_, i) => i);

  loading = signal(true);
  periodLabel = signal('');
  weeks = signal<CalendarCell[][]>([]);
  agenda = signal<Schedule[]>([]);
  error = signal<string | null>(null);
  popupIso = signal<string | null>(null);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.presenter.load();
  }

  prev(): void { this.presenter.prevMonth(); }
  next(): void { this.presenter.nextMonth(); }
  today(): void { this.presenter.goToday(); }
  reload(): void { this.presenter.load(); }

  openPopup(iso: string): void { this.popupIso.set(iso); }
  closePopup(): void { this.popupIso.set(null); }
  togglePopup(iso: string): void { this.popupIso.update((cur) => (cur === iso ? null : iso)); }

  cat(value: string): ScheduleCategoryMeta { return categoryMeta(value); }
  timeRange(s: Schedule): string { return formatTimeRange(s); }
  dateRange(s: Schedule): string { return formatDateRange(s); }
  longDate(d: Date): string { return formatLongDate(d); }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setPeriod(year: number, month: number): void { this.periodLabel.set(`${monthName(month)} ${year}`); }
  setCalendar(weeks: CalendarCell[][]): void { this.weeks.set(weeks); }
  setAgenda(items: Schedule[]): void { this.agenda.set(items); }
  setError(message: string | null): void { this.error.set(message); }
}
