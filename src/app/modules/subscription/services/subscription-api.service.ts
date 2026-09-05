import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Subscriber, BulkAddResult } from '../entities/subscriber';

/** Raw HTTP calls for the subscription (newsletter) module — public & CMS. */
@Injectable({ providedIn: 'root' })
export class SubscriptionApiService {
  private api = inject(ApiService);

  subscribe(email: string): Observable<unknown> { return this.api.post('/public/subscribers', { email }); }
  unsubscribe(email: string, token: string): Observable<unknown> {
    return this.api.post('/public/subscribers/unsubscribe', { email, token });
  }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Subscriber>> { return this.api.get('/subscribers', q); }
  cmsGet(id: number): Observable<Subscriber> { return this.api.get(`/subscribers/${id}`); }
  bulkAdd(emails: string): Observable<BulkAddResult> { return this.api.post('/subscribers/bulk', { emails }); }
  update(id: number, body: { email: string; isActive: boolean }): Observable<Subscriber> { return this.api.put(`/subscribers/${id}`, body); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/subscribers/${id}`); }
  bulkRemove(ids: number[]): Observable<unknown> { return this.api.post('/subscribers/bulk-delete', { ids }); }
}
