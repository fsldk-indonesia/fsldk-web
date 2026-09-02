import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ScheduleApiService } from '../services/schedule-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Schedule } from '../entities/schedule';

/** The schedule module's public data API — the rest of the app injects this. */
@Injectable({ providedIn: 'root' })
export class ScheduleRepository {
  private api = inject(ScheduleApiService);

  publicRange(from: string, to: string): Observable<Schedule[]> { return this.api.publicRange(from, to); }
  cmsList(q: Record<string, unknown>): Observable<Pagination<Schedule>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<Schedule> { return this.api.cmsGet(id); }
  create(body: unknown): Observable<Schedule> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<Schedule> { return this.api.update(id, body); }
  publish(id: number, isActive: boolean): Observable<unknown> { return this.api.publish(id, isActive); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
}
