import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ReportRepository } from '../../repositories/report.repository';
import { KantongAmalAdminReconciliationView } from './kantong-amal.admin-reconciliation.view';

@Injectable()
export class KantongAmalAdminReconciliationPresenter extends BasePresenter<KantongAmalAdminReconciliationView> {
  private reportRepo = inject(ReportRepository);

  load(page: number, limit: number): void {
    this.view.setLoading(true);
    this.reportRepo.reconciliationHistory({ page, limit }).subscribe({
      next: (p) => { this.view.setSnapshots(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  run(): void {
    this.view.setRunning(true);
    this.reportRepo.runReconciliation().subscribe({
      next: () => { this.view.setRunning(false); this.view.onRunSuccess(); },
      error: () => this.view.setRunning(false),
    });
  }
}
