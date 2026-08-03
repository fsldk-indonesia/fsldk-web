import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardApiService } from '../services/dashboard-api.service';
import { DashboardSummary } from '../entities/dashboard-summary';

@Injectable({ providedIn: 'root' })
export class DashboardRepository {
  private api = inject(DashboardApiService);

  summary(): Observable<DashboardSummary> { return this.api.summary(); }
}
