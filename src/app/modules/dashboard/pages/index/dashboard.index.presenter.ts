import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { DashboardRepository } from '../../repositories/dashboard.repository';
import { DashboardIndexView } from './dashboard.index.view';

@Injectable()
export class DashboardIndexPresenter extends BasePresenter<DashboardIndexView> {
  private dashboardRepo = inject(DashboardRepository);
  private orgContext = inject(OrgContextService);
  private route = inject(ActivatedRoute);

  load(): void {
    this.orgContext.organizationID$(this.route).subscribe((organizationID) => {
      this.view.setLoading(true);
      this.dashboardRepo.summary(organizationID).subscribe({
        next: (d) => { this.view.setSummary(d); this.view.setLoading(false); },
        error: () => this.view.setLoading(false),
      });
    });
  }
}
