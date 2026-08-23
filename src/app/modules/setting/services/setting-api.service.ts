import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Setting } from '../entities/setting';

/** Panggilan HTTP mentah untuk App Settings (/settings). */
@Injectable({ providedIn: 'root' })
export class SettingApiService {
  private api = inject(ApiService);

  list(): Observable<Setting[]> { return this.api.get('/settings'); }
  update(id: number, settingValue: string): Observable<Setting> { return this.api.put(`/settings/${id}`, { settingValue }); }
}
