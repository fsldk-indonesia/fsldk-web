import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ShortlinkApiService } from '../services/shortlink-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { ShortLink } from '../entities/shortlink';

@Injectable({ providedIn: 'root' })
export class ShortlinkRepository {
  private api = inject(ShortlinkApiService);

  list(q: Record<string, unknown>): Observable<Pagination<ShortLink>> { return this.api.list(q); }
  get(id: number): Observable<ShortLink> { return this.api.get(id); }
  create(body: { destinationURL: string; shortKey?: string }): Observable<ShortLink> { return this.api.create(body); }
  update(id: number, body: { destinationURL: string; shortKey: string }): Observable<ShortLink> { return this.api.update(id, body); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
  resolve(key: string): Observable<{ destinationURL: string }> { return this.api.resolve(key); }
}
