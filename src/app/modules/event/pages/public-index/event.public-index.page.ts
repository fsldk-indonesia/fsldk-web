import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Event } from '../../entities/event';
import { IconComponent } from '../../../../shared/icon.component';
import { EventPublicIndexPresenter } from './event.public-index.presenter';
import { EventPublicIndexView } from './event.public-index.view';

const STATUS_CHIPS = [
  { value: '', label: 'Semua' },
  { value: 'upcoming', label: 'Akan Datang' },
  { value: 'ongoing', label: 'Berlangsung' },
  { value: 'past', label: 'Telah Selesai' },
];

@Component({
  selector: 'app-event-public-index-page',
  standalone: true,
  templateUrl: './event.public-index.page.html',
  imports: [RouterLink, DatePipe, FormsModule, IconComponent],
  providers: [EventPublicIndexPresenter],
  styles: [`
    /* Gradient wash matching news & article pages */
    .section { background: linear-gradient(180deg, var(--color-primary-soft) 0%, var(--color-primary-tint) 220px, #fff 520px); }
    .filters { display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .search { max-width: 460px; }
    .chips { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
    .news-card { display: block; background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--motion-base) ease, transform var(--motion-base) var(--ease-out); }
    .news-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); text-decoration: none; }
    .news-thumb { aspect-ratio: 16/10; background: var(--color-primary-soft); display: flex; align-items: center; justify-content: center; color: var(--color-primary-dark); font-size: .8rem; font-weight: 700; letter-spacing: .08em; position: relative; }
    .news-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .status-tag { position: absolute; top: 12px; right: 12px; font-size: .72rem; font-weight: 700; padding: 3px 10px; border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: .04em; }
    .status-upcoming { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
    .status-ongoing { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .status-past { background: #f3f4f6; color: #6b7280; border: 1px solid #e5e7eb; }
    .news-body { padding: 20px; } .news-body h3 { margin: 12px 0 8px; font-size: 1.12rem; line-height: 1.4; }
    .meta { color: var(--color-muted); font-size: .85rem; margin: 8px 0 0; }
    .pager { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 36px; color: var(--color-text-secondary); font-size: .9rem; }
  `],
})
export class EventPublicIndexPage implements OnInit, EventPublicIndexView {
  private presenter = inject(EventPublicIndexPresenter);

  items = signal<Event[]>([]);
  loading = signal(true);
  page = signal(1);
  count = signal(0);
  readonly limit = 9;

  search = '';
  status = '';
  statusChips = STATUS_CHIPS;

  ngOnInit(): void { this.presenter.attachView(this); this.load(); }

  load(): void { this.presenter.load(this.page(), this.limit, this.search, '', '', this.status, 'newest'); }
  applySearch(): void { this.page.set(1); this.load(); }
  filterStatus(s: string): void { this.status = s; this.page.set(1); this.load(); }
  go(p: number): void { this.page.set(p); this.load(); }
  totalPages(): number { return Math.max(1, Math.ceil(this.count() / this.limit)); }

  statusLabel(s: string): string {
    return ({ upcoming: 'Akan Datang', ongoing: 'Berlangsung', past: 'Selesai' } as Record<string, string>)[s] ?? s;
  }

  setLoading(loading: boolean): void { this.loading.set(loading); }
  setEvents(events: Event[], count: number): void { this.items.set(events); this.count.set(count); }
}
