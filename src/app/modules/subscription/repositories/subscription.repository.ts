import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SubscriptionApiService } from '../services/subscription-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Subscriber, BulkAddResult } from '../entities/subscriber';

/** The subscription module's public data API — the rest of the app injects this. */
@Injectable({ providedIn: 'root' })
export class SubscriptionRepository {
  private api = inject(SubscriptionApiService);

  subscribe(email: string): Observable<unknown> { return this.api.subscribe(email); }
  unsubscribe(email: string, token: string): Observable<unknown> { return this.api.unsubscribe(email, token); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Subscriber>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<Subscriber> { return this.api.cmsGet(id); }
  bulkAdd(emails: string): Observable<BulkAddResult> { return this.api.bulkAdd(emails); }
  update(id: number, body: { email: string; isActive: boolean }): Observable<Subscriber> { return this.api.update(id, body); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
  bulkRemove(ids: number[]): Observable<unknown> { return this.api.bulkRemove(ids); }
}
