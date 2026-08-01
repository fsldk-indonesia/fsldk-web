import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleApiService } from '../services/role-api.service';
import { Role } from '../entities/role';

@Injectable({ providedIn: 'root' })
export class RoleRepository {
  private api = inject(RoleApiService);

  list(search = ''): Observable<Role[]> { return this.api.list(search); }
  get(id: number): Observable<Role> { return this.api.get(id); }
  create(body: unknown): Observable<Role> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<Role> { return this.api.update(id, body); }
  setPermissions(id: number, permissionIDs: number[]): Observable<Role> { return this.api.setPermissions(id, permissionIDs); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
}
