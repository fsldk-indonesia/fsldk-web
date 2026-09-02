import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ScheduleRepository } from '../../repositories/schedule.repository';
import { Schedule } from '../../entities/schedule';
import { buildCalendarGrid, sameDate, schedulesOnDate, toISODate, touchesMonth } from '../../schedule.constants';
import { CalendarCell, SchedulePublicIndexView } from './schedule.public-index.view';

@Injectable()
export class SchedulePublicIndexPresenter extends BasePresenter<SchedulePublicIndexView> {
  private repo = inject(ScheduleRepository);

  private viewYear = new Date().getFullYear();
  private viewMonth = new Date().getMonth() + 1; // 1..12

  load(): void {
    this.view.setLoading(true);
    this.view.setError(null);
    this.view.setPeriod(this.viewYear, this.viewMonth);

    const grid = buildCalendarGrid(this.viewYear, this.viewMonth);
    const from = toISODate(grid[0]);
    const to = toISODate(grid[grid.length - 1]);

    this.repo.publicRange(from, to).subscribe({
      next: (rows) => {
        this.render(rows ?? []);
        this.view.setLoading(false);
      },
      error: () => {
        this.render([]);
        this.view.setError('Gagal memuat jadwal. Silakan coba lagi.');
        this.view.setLoading(false);
      },
    });
  }

  prevMonth(): void { this.shift(-1); }
  nextMonth(): void { this.shift(1); }

  goToday(): void {
    const now = new Date();
    this.viewYear = now.getFullYear();
    this.viewMonth = now.getMonth() + 1;
    this.load();
  }

  private shift(delta: number): void {
    const base = new Date(this.viewYear, this.viewMonth - 1 + delta, 1);
    this.viewYear = base.getFullYear();
    this.viewMonth = base.getMonth() + 1;
    this.load();
  }

  private render(rows: Schedule[]): void {
    const today = new Date();
    const cells: CalendarCell[] = buildCalendarGrid(this.viewYear, this.viewMonth).map((date) => ({
      date,
      iso: toISODate(date),
      day: date.getDate(),
      inMonth: date.getMonth() + 1 === this.viewMonth,
      isToday: sameDate(date, today),
      items: schedulesOnDate(rows, date),
    }));

    const weeks: CalendarCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    this.view.setCalendar(weeks);

    const agenda = rows
      .filter((s) => touchesMonth(s, this.viewYear, this.viewMonth))
      .sort((a, b) => (a.startDate === b.startDate
        ? (a.startTime ?? '').localeCompare(b.startTime ?? '')
        : a.startDate.localeCompare(b.startDate)));
    this.view.setAgenda(agenda);
  }
}
