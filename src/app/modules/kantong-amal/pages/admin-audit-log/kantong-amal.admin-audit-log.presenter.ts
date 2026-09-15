import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { FinanceAuditLogItem } from '../../entities/audit-log';
import { ReportRepository } from '../../repositories/report.repository';
import { KantongAmalAdminAuditLogView } from './kantong-amal.admin-audit-log.view';

@Injectable()
export class KantongAmalAdminAuditLogPresenter extends BasePresenter<KantongAmalAdminAuditLogView> {
  private reportRepo = inject(ReportRepository);

  /** dataSource untuk <app-cms-index> — Entity & Aksi adalah dua target
   *  pencarian independen (exact match di backend, lihat
   *  report_repository_impl.go ListFinanceAuditLog), dipilih lewat dropdown
   *  target search bawaan CmsIndexComponent. */
  list(params: CmsListParams): Observable<Pagination<FinanceAuditLogItem>> {
    return this.reportRepo.auditLog({
      page: params.page, limit: params.limit,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      entity: (params.filters['entity'] ?? [])[0] ?? '',
      action: (params.filters['action'] ?? [])[0] ?? '',
    });
  }
}
