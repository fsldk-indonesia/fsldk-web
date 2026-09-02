import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Schedule } from '../entities/schedule';

/** Raw HTTP calls for schedules — public calendar & CMS. */
@Injectable({ providedIn: 'root' })
export class ScheduleApiService {
  private api = inject(ApiService);

  /** Active schedules overlapping [from, to] ("YYYY-MM-DD"). Plain array, no pagination. */
  publicRange(from: string, to: string): Observable<Schedule[]> {
    return this.api.get('/public/schedules', { from, to });
  }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Schedule>> { return this.api.get('/schedules', q); }
  cmsGet(id: number): Observable<Schedule> { return this.api.get(`/schedules/${id}`); }
  create(body: unknown): Observable<Schedule> { return this.api.post('/schedules', body); }
  update(id: number, body: unknown): Observable<Schedule> { return this.api.put(`/schedules/${id}`, body); }
  publish(id: number, isActive: boolean): Observable<unknown> { return this.api.patch(`/schedules/${id}/publish`, { isActive }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/schedules/${id}`); }
}
