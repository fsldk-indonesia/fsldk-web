import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Role } from '../entities/role';

/** Panggilan HTTP mentah untuk manajemen role (/roles). */
@Injectable({ providedIn: 'root' })
export class RoleApiService {
  private api = inject(ApiService);

  list(search = ''): Observable<Role[]> { return this.api.get('/roles', { search }); }
  get(id: number): Observable<Role> { return this.api.get(`/roles/${id}`); }
  create(body: unknown): Observable<Role> { return this.api.post('/roles', body); }
  update(id: number, body: unknown): Observable<Role> { return this.api.put(`/roles/${id}`, body); }
  setPermissions(id: number, permissionIDs: number[]): Observable<Role> { return this.api.put(`/roles/${id}/permissions`, { permissionIDs }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/roles/${id}`); }
}
