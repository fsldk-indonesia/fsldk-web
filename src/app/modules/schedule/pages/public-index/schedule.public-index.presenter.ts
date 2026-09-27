import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ScheduleRepository } from '../../repositories/schedule.repository';
import { Schedule } from '../../entities/schedule';
import { buildCalendarGrid, buildMonthView, toISODate } from '../../schedule.constants';
import { SchedulePublicIndexView } from './schedule.public-index.view';

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
    const { weeks, agenda } = buildMonthView(this.viewYear, this.viewMonth, rows);
    this.view.setCalendar(weeks);
    this.view.setAgenda(agenda);
  }
}
