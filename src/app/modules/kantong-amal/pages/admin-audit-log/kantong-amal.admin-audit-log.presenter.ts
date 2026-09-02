import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ReportRepository } from '../../repositories/report.repository';
import { KantongAmalAdminAuditLogView } from './kantong-amal.admin-audit-log.view';

@Injectable()
export class KantongAmalAdminAuditLogPresenter extends BasePresenter<KantongAmalAdminAuditLogView> {
  private reportRepo = inject(ReportRepository);

  load(page: number, limit: number, entity: string, action: string): void {
    this.view.setLoading(true);
    this.reportRepo.auditLog({ page, limit, entity: entity || undefined, action: action || undefined }).subscribe({
      next: (p) => { this.view.setLogs(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
