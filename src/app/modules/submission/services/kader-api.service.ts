import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { KaderInfo } from '../entities/submission';

/** Panggilan HTTP mentah untuk data kader (/kaders) — persetujuan & kartu digital. */
@Injectable({ providedIn: 'root' })
export class KaderApiService {
  private api = inject(ApiService);

  list(q: { status?: string; page?: number; limit?: number; organizationID?: number }): Observable<Pagination<KaderInfo>> {
    return this.api.get('/kaders', q);
  }
  getCode(id: number): Observable<KaderInfo> { return this.api.get(`/kaders/${id}/code`); }
  deactivate(id: number): Observable<unknown> { return this.api.post(`/kaders/${id}/deactivate`); }
  reinstate(id: number): Observable<unknown> { return this.api.post(`/kaders/${id}/reinstate`); }
}
