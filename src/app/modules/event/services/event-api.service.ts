import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Event } from '../entities/event';

/** Raw HTTP calls for the event module — public & CMS. */
@Injectable({ providedIn: 'root' })
export class EventApiService {
  private api = inject(ApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Event>> { return this.api.get('/public/events', q); }
  publicDetail(slug: string): Observable<Event> { return this.api.get(`/public/events/${slug}`); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Event>> { return this.api.get('/events', q); }
  cmsGet(id: number): Observable<Event> { return this.api.get(`/events/${id}`); }
  create(body: unknown): Observable<Event> { return this.api.post('/events', body); }
  update(id: number, body: unknown): Observable<Event> { return this.api.put(`/events/${id}`, body); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/events/${id}`); }
}
