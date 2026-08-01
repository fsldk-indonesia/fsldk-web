import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { DashboardRepository } from '../../repositories/dashboard.repository';
import { DashboardIndexView } from './dashboard.index.view';

@Injectable()
export class DashboardIndexPresenter extends BasePresenter<DashboardIndexView> {
  private dashboardRepo = inject(DashboardRepository);

  load(): void {
    this.dashboardRepo.summary().subscribe({ next: (d) => this.view.setSummary(d), error: () => {} });
    this.dashboardRepo.recentNews().subscribe({ next: (r) => this.view.setRecentNews(r), error: () => {} });
  }
}
