import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SettingApiService } from '../services/setting-api.service';
import { Setting } from '../entities/setting';

@Injectable({ providedIn: 'root' })
export class SettingRepository {
  private api = inject(SettingApiService);

  list(): Observable<Setting[]> { return this.api.list(); }
  update(id: number, settingValue: string): Observable<Setting> { return this.api.update(id, settingValue); }
}
