import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { ShortLink } from '../entities/shortlink';

/** Panggilan HTTP mentah untuk manajemen shortlink (/shortlinks). */
@Injectable({ providedIn: 'root' })
export class ShortlinkApiService {
  private api = inject(ApiService);

  list(q: Record<string, unknown>): Observable<Pagination<ShortLink>> { return this.api.get('/shortlinks', q); }
  get(id: number): Observable<ShortLink> { return this.api.get(`/shortlinks/${id}`); }
  create(body: { destinationURL: string; shortKey?: string }): Observable<ShortLink> { return this.api.post('/shortlinks', body); }
  update(id: number, body: { destinationURL: string; shortKey: string }): Observable<ShortLink> { return this.api.put(`/shortlinks/${id}`, body); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/shortlinks/${id}`); }

  /** Resolusi publik (tanpa auth) — dipakai halaman redirect catch-all /:key. */
  resolve(key: string): Observable<{ destinationURL: string }> { return this.api.get(`/public/shortlinks/${key}`); }
}
