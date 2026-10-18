import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PengurusApiService } from '../services/pengurus-api.service';
import { PengurusEntry } from '../entities/pengurus';

@Injectable({ providedIn: 'root' })
export class PengurusRepository {
  private api = inject(PengurusApiService);

  list(): Observable<PengurusEntry[]> { return this.api.list(); }
  updateRole(userID: number, roleName: string): Observable<PengurusEntry> { return this.api.updateRole(userID, roleName); }
}
