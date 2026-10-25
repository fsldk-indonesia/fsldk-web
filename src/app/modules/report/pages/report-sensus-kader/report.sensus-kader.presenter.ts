import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { Pagination } from '../../../../core/entities/pagination';
import { ReportRepository } from '../../repositories/report.repository';
import { KaderFilterValue, KaderReportRow, ExportFormat } from '../../entities/report';
import { ReportSensusKaderView } from './report.sensus-kader.view';

@Injectable()
export class ReportSensusKaderPresenter extends BasePresenter<ReportSensusKaderView> {
  private reportRepo = inject(ReportRepository);
  private toast = inject(ToastService);

  list(filter: KaderFilterValue, page: number, limit: number, sort: string, organizationID?: number): Observable<Pagination<KaderReportRow>> {
    return this.reportRepo.listSensusKader(filter, page, limit, sort, organizationID);
  }

  download(filter: KaderFilterValue, format: ExportFormat, organizationID?: number): void {
    this.view.setExporting(true);
    this.reportRepo.exportSensusKader(filter, format, organizationID).subscribe({
      next: () => { this.view.setExporting(false); this.toast.success('Laporan berhasil diunduh'); },
      error: () => this.view.setExporting(false),
    });
  }
}
