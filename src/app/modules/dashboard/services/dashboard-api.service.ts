import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DashboardSummary } from '../entities/dashboard-summary';

/** Panggilan HTTP mentah untuk dashboard CMS. */
@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private api = inject(ApiService);

  summary(organizationID?: number): Observable<DashboardSummary> {
    return this.api.get('/dashboard/summary', { organizationID });
  }
}
