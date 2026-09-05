import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { NetworkStats, DirectoryEntry } from '../entities/statistic';

/** Raw HTTP calls for the public network statistics feature. */
@Injectable({ providedIn: 'root' })
export class StatisticApiService {
  private api = inject(ApiService);

  networkStats(): Observable<NetworkStats> { return this.api.get('/public/network-stats'); }
  directory(q: Record<string, unknown>): Observable<Pagination<DirectoryEntry>> { return this.api.get('/public/network-stats/directory', q); }
}
