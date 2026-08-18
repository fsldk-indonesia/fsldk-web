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
    // tier diwariskan dari route data shell (cms/cms-ldk/cms-puskomda/
    // cms-puskomnas — lihat app.config.ts paramsInheritanceStrategy:'always')
    // — CMS Utama tidak punya organizationID sama sekali, jadi tier-nya
    // dikirim eksplisit supaya backend tidak salah jatuh ke ringkasan
    // Puskomnas untuk akun wildcard (miss-development-prompt-3.md poin 5).
    const tier = this.route.snapshot.data['tier'] as string | undefined;
    this.orgContext.organizationID$(this.route).subscribe((organizationID) => {
      this.view.setLoading(true);
      this.dashboardRepo.summary(organizationID, tier).subscribe({
        next: (d) => { this.view.setSummary(d); this.view.setLoading(false); },
        error: () => this.view.setLoading(false),
      });
    });
  }
}
