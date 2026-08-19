import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { MentionUser, UserRow } from '../entities/user';

/** Panggilan HTTP mentah untuk manajemen pengguna CMS (/users). */
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private api = inject(ApiService);

  list(q: Record<string, unknown>): Observable<Pagination<UserRow>> { return this.api.get('/users', q); }
  searchMentionable(q: string, limit = 8): Observable<MentionUser[]> {
    return this.api.get('/users/mention-search', { q, limit });
  }
  get(id: number): Observable<UserRow> { return this.api.get(`/users/${id}`); }
  create(body: unknown): Observable<UserRow> { return this.api.post('/users', body); }
  update(id: number, body: unknown): Observable<UserRow> { return this.api.put(`/users/${id}`, body); }
  setStatus(id: number, isActive: boolean): Observable<unknown> { return this.api.patch(`/users/${id}/status`, { isActive }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/users/${id}`); }
}
