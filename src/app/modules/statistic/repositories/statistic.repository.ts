import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StatisticApiService } from '../services/statistic-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { NetworkStats, DirectoryEntry } from '../entities/statistic';

/** The statistic module's public data API — the rest of the app injects this. */
@Injectable({ providedIn: 'root' })
export class StatisticRepository {
  private api = inject(StatisticApiService);

  networkStats(): Observable<NetworkStats> { return this.api.networkStats(); }
  directory(q: Record<string, unknown>): Observable<Pagination<DirectoryEntry>> { return this.api.directory(q); }
}
