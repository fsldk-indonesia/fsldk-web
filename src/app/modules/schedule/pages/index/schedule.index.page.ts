import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { IconComponent } from '../../../../shared/icon.component';
import { SelectComponent } from '../../../../shared/select.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { Schedule } from '../../entities/schedule';
import { MONTHS_ID, SCHEDULE_CATEGORIES, categoryMeta, formatDateRange, formatTimeRange } from '../../schedule.constants';
import { ScheduleIndexPresenter } from './schedule.index.presenter';
import { ScheduleIndexView } from './schedule.index.view';

@Component({
  selector: 'app-schedule-index-page',
  standalone: true,
  templateUrl: './schedule.index.page.html',
  imports: [RouterLink, FormsModule, IconComponent, SelectComponent, PaginationComponent],
  providers: [ScheduleIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; } .cat-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }`],
})
export class ScheduleIndexPage implements OnInit, ScheduleIndexView {
  private presenter = inject(ScheduleIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  schedules = signal<Schedule[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  readonly limit = 10;
  busy = signal<ReadonlySet<number>>(new Set());

  search = '';
  category = '';
  month = 0;
  year: number | null = null;
  dateFrom = '';
  dateTo = '';

  canCreate = this.auth.hasPermission('schedule.create');
  canUpdate = this.auth.hasPermission('schedule.update');
  canPublish = this.auth.hasPermission('schedule.publish');
  canDelete = this.auth.hasPermission('schedule.delete');

  categoryOptions = computed(() => [
    { value: '', label: 'Semua Kategori' },
    ...SCHEDULE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  ]);
  monthOptions = computed(() => [
    { value: 0, label: 'Semua Bulan' },
    ...MONTHS_ID.map((m, i) => ({ value: i + 1, label: m })),
  ]);

  ngOnInit(): void {
    this.presenter.attachView(this);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.presenter.load(this.page(), this.limit, {
      search: this.search, category: this.category, month: this.month,
      year: this.year, dateFrom: this.dateFrom, dateTo: this.dateTo,
    });
  }
  apply(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }

  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const next = new Set(s); next.delete(id); return next; }); }

  catLabel(value: string): string { return categoryMeta(value).label; }
  catColor(value: string): string { return categoryMeta(value).color; }
  dateText(s: Schedule): string { return formatDateRange(s); }
  timeText(s: Schedule): string { return formatTimeRange(s) || '—'; }

  togglePublish(s: Schedule): void { this.setBusy(s.scheduleID); this.presenter.togglePublish(s); }
  async remove(s: Schedule, event?: Event): Promise<void> {
    const ok = await this.alert.confirm(`Hapus jadwal "${s.title}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Jadwal', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, event);
    if (!ok) return;
    this.setBusy(s.scheduleID);
    this.presenter.remove(s);
  }

  setSchedules(items: Schedule[], count: number): void { this.schedules.set(items); this.count.set(count); this.loading.set(false); }
  onPublishToggleSuccess(): void { this.load(); }
  onRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }
}
