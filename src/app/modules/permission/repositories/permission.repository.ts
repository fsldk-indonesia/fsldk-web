import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PermissionApiService } from '../services/permission-api.service';
import { MenuItem } from '../entities/menu-item';
import { Permission } from '../entities/permission';

@Injectable({ providedIn: 'root' })
export class PermissionRepository {
  private api = inject(PermissionApiService);

  getMenus(): Observable<MenuItem[]> {
    return this.api.getMenus();
  }

  list(): Observable<Permission[]> {
    return this.api.list();
  }
}
