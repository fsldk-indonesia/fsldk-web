import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EventApiService } from '../services/event-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Event } from '../entities/event';

@Injectable({ providedIn: 'root' })
export class EventRepository {
  private api = inject(EventApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Event>> { return this.api.publicList(q); }
  publicDetail(slug: string): Observable<Event> { return this.api.publicDetail(slug); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Event>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<Event> { return this.api.cmsGet(id); }
  create(body: unknown): Observable<Event> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<Event> { return this.api.update(id, body); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
}
