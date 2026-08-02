import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserApiService } from '../services/user-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { UserRow } from '../entities/user';

/** Data manajemen pengguna CMS. */
@Injectable({ providedIn: 'root' })
export class UserRepository {
  private api = inject(UserApiService);

  list(q: Record<string, unknown>): Observable<Pagination<UserRow>> { return this.api.list(q); }
  get(id: number): Observable<UserRow> { return this.api.get(id); }
  create(body: unknown): Observable<UserRow> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<UserRow> { return this.api.update(id, body); }
  setStatus(id: number, isActive: boolean): Observable<unknown> { return this.api.setStatus(id, isActive); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
}
