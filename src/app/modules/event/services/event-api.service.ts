import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Event } from '../entities/event';

/** Query params opsional untuk listPublic — search (judul/divisi), division
 *  (multi-select), year (multi-select), status (timing, multi-select).
 *  Array di-join(',') manual di listPublic() di bawah — BEDA dari Artikel/
 *  Galeri yang mengirim array lewat ApiService.toParams() sebagai query key
 *  berulang: backend event_handler_impl.go ListPublic membaca lewat
 *  c.Query() + splitQuery (comma-separated), bukan c.QueryArray(), jadi kirim
 *  repeated key akan kehilangan semua nilai selain yang pertama. */
export interface EventPublicListParams {
  search?: string;
  division?: string[];
  year?: number[];
  status?: string[];
}

/** Nilai distinct Divisi & Tahun yang ada di data — mengisi dropdown filter publik. */
export interface EventFilterOptions {
  divisions: string[];
  years: number[];
}

/** Raw HTTP calls for the event module — public & CMS. */
@Injectable({ providedIn: 'root' })
export class EventApiService {
  private api = inject(ApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Event>> { return this.api.get('/public/events', q); }

  /** Varian terstruktur publicList() di atas — dipakai halaman listing publik
   *  dengan filter divisi/tahun/status & sort. publicList(q) TETAP ada,
   *  dipakai pemanggil yang cuma butuh page/limit mentah (mis. "Event Lainnya"
   *  di halaman detail). */
  listPublic(page = 1, limit = 9, sort = 'newest', params: EventPublicListParams = {}): Observable<Pagination<Event>> {
    const query: Record<string, unknown> = { page, limit, sort };
    if (params.search) query['search'] = params.search;
    if (params.division?.length) query['division'] = params.division.join(',');
    if (params.year?.length) query['year'] = params.year.join(',');
    if (params.status?.length) query['status'] = params.status.join(',');
    return this.api.get('/public/events', query);
  }

  getPublicFilterOptions(): Observable<EventFilterOptions> { return this.api.get('/public/events/filter-options'); }

  publicDetail(slug: string): Observable<Event> { return this.api.get(`/public/events/${slug}`); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Event>> { return this.api.get('/events', q); }
  cmsGet(id: number): Observable<Event> { return this.api.get(`/events/${id}`); }
  create(body: unknown): Observable<Event> { return this.api.post('/events', body); }
  update(id: number, body: unknown): Observable<Event> { return this.api.put(`/events/${id}`, body); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/events/${id}`); }
  bulkDelete(ids: number[]): Observable<unknown> { return this.api.post('/events/bulk-delete', { ids }); }
}
