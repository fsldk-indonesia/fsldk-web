import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { EventApiService, EventFilterOptions, EventPublicListParams } from '../services/event-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Event } from '../entities/event';

/**
 * State and data repository for the Event module. Signals di sini murni
 * untuk halaman publik (dikonsumsi langsung lewat template, lihat
 * EventPublicIndexPage/EventPublicDetailPage) — sisi CMS & konsumer lain
 * memakai method yang me-return Observable langsung, pola sama seperti
 * ArticleRepository.
 */
@Injectable({ providedIn: 'root' })
export class EventRepository {
  private api = inject(EventApiService);

  // Public signals
  publicEvents = signal<Event[]>([]);
  publicPage = signal<number>(1);
  publicTotal = signal<number>(0);
  currentEvent = signal<Event | null>(null);

  /** Opsi dropdown filter publik (Divisi, Tahun) — dimuat sekali lewat
   *  loadFilterOptions(), independen dari loading()/error() di bawah. */
  filterOptions = signal<EventFilterOptions | null>(null);
  filterOptionsLoading = signal<boolean>(false);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  loadPublic(page = 1, limit = 9, sort = 'newest', params: EventPublicListParams = {}): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listPublic(page, limit, sort, params).subscribe({
      next: (result) => {
        this.publicEvents.set(result.data);
        this.publicPage.set(result.page);
        this.publicTotal.set(result.count);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat event');
        this.loading.set(false);
      },
    });
  }

  loadFilterOptions(): void {
    if (this.filterOptions() || this.filterOptionsLoading()) return;
    this.filterOptionsLoading.set(true);
    this.api.getPublicFilterOptions().subscribe({
      next: (opts) => {
        this.filterOptions.set(opts);
        this.filterOptionsLoading.set(false);
      },
      error: () => this.filterOptionsLoading.set(false),
    });
  }

  loadPublicDetail(slug: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.publicDetail(slug).subscribe({
      next: (event) => {
        this.currentEvent.set(event);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat detail event');
        this.currentEvent.set(null);
        this.loading.set(false);
      },
    });
  }

  publicList(q: Record<string, unknown>): Observable<Pagination<Event>> { return this.api.publicList(q); }
  publicDetail(slug: string): Observable<Event> { return this.api.publicDetail(slug); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Event>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<Event> { return this.api.cmsGet(id); }
  create(body: unknown): Observable<Event> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<Event> { return this.api.update(id, body); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
  bulkDelete(ids: number[]): Observable<unknown> { return this.api.bulkDelete(ids); }
}
