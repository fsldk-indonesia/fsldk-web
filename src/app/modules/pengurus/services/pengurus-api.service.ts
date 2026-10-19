import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PengurusEntry } from '../entities/pengurus';

/** Panggilan HTTP mentah untuk fitur Pengurus (/pengurus) — promosi/demosi
 *  role kader aktif dalam scope organisasi caller sendiri. */
@Injectable({ providedIn: 'root' })
export class PengurusApiService {
  private api = inject(ApiService);

  list(organizationID?: number): Observable<PengurusEntry[]> {
    return this.api.get('/pengurus', organizationID ? { organizationID } : undefined);
  }
  updateRole(userID: number, roleName: string): Observable<PengurusEntry> {
    return this.api.patch(`/pengurus/${userID}/role`, { roleName });
  }
}
