import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthRepository } from '../../../user/repositories/auth.repository';
import { AlertService } from '../../../../core/services/alert.service';
import { Event as AppEvent } from '../../entities/event';
import { IconComponent } from '../../../../shared/icon.component';
import { PaginationComponent } from '../../../../shared/pagination.component';
import { EventIndexPresenter } from './event.index.presenter';
import { EventIndexView } from './event.index.view';

@Component({
  selector: 'app-event-index-page',
  standalone: true,
  templateUrl: './event.index.page.html',
  imports: [RouterLink, DatePipe, FormsModule, IconComponent, PaginationComponent],
  providers: [EventIndexPresenter],
  styles: [`.page-head { margin-bottom: 24px; } .page-head h1 { margin-bottom: 2px; }`],
})
export class EventIndexPage implements OnInit, EventIndexView {
  private presenter = inject(EventIndexPresenter);
  private auth = inject(AuthRepository);
  private alert = inject(AlertService);

  events = signal<AppEvent[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  readonly limit = 15;
  busy = signal<ReadonlySet<number>>(new Set());

  search = '';
  division = '';

  canCreate = this.auth.hasPermission('event.create');
  canUpdate = this.auth.hasPermission('event.update');
  canDelete = this.auth.hasPermission('event.delete');

  ngOnInit(): void { this.presenter.attachView(this); this.load(); }

  load(): void { this.loading.set(true); this.presenter.load(this.page(), this.limit, this.search, this.division); }
  apply(): void { this.page.set(1); this.load(); }
  goPage(p: number): void { this.page.set(p); this.load(); }
  isBusy(id: number): boolean { return this.busy().has(id); }
  private setBusy(id: number): void { this.busy.update((s) => new Set(s).add(id)); }
  private clearBusy(id: number): void { this.busy.update((s) => { const n = new Set(s); n.delete(id); return n; }); }

  async remove(e: AppEvent, domEvent?: MouseEvent): Promise<void> {
    const ok = await this.alert.confirm(`Hapus event "${e.eventTitle}"? Tindakan ini tidak dapat dibatalkan.`, {
      title: 'Hapus Event', confirmLabel: 'Ya, Hapus', variant: 'danger',
    }, domEvent);
    if (!ok) return;
    this.setBusy(e.eventID);
    this.presenter.remove(e);
  }

  setEvents(events: AppEvent[], count: number): void { this.events.set(events); this.count.set(count); this.loading.set(false); }
  onRemoveSuccess(): void { this.load(); }
  onActionSettled(id: number): void { this.clearBusy(id); }

  statusLabel(s: string): string {
    return ({ upcoming: 'Akan Datang', ongoing: 'Berlangsung', past: 'Selesai' } as Record<string, string>)[s] ?? '–';
  }
}
