import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { KaderApiService } from '../services/kader-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { KaderInfo } from '../entities/submission';

@Injectable({ providedIn: 'root' })
export class KaderRepository {
  private api = inject(KaderApiService);

  list(status: string, organizationID?: number, page = 1, limit = 50): Observable<Pagination<KaderInfo>> {
    return this.api.list({ status, page, limit, organizationID });
  }
  getCode(id: number): Observable<KaderInfo> { return this.api.getCode(id); }
  deactivate(id: number): Observable<unknown> { return this.api.deactivate(id); }
  reinstate(id: number): Observable<unknown> { return this.api.reinstate(id); }
}
