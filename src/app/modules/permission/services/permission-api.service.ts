import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MenuItem } from '../entities/menu-item';
import { Permission } from '../entities/permission';

/** Panggilan HTTP mentah untuk menu sidebar & daftar permission. */
@Injectable({ providedIn: 'root' })
export class PermissionApiService {
  private api = inject(ApiService);

  getMenus(): Observable<MenuItem[]> {
    return this.api.get<MenuItem[]>('/me/menus');
  }

  list(): Observable<Permission[]> {
    return this.api.get<Permission[]>('/permissions');
  }
}
