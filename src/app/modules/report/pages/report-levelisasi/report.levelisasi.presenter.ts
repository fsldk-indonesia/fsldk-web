import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { Pagination } from '../../../../core/entities/pagination';
import { ReportRepository } from '../../repositories/report.repository';
import { ReportFilterValue, ReportSubmissionRow, ExportFormat } from '../../entities/report';
import { ReportLevelisasiView } from './report.levelisasi.view';

@Injectable()
export class ReportLevelisasiPresenter extends BasePresenter<ReportLevelisasiView> {
  private reportRepo = inject(ReportRepository);
  private toast = inject(ToastService);

  list(filter: ReportFilterValue, page: number, limit: number, sort: string, organizationID?: number): Observable<Pagination<ReportSubmissionRow>> {
    return this.reportRepo.listLevelisasi(filter, page, limit, sort, organizationID);
  }

  download(filter: ReportFilterValue, format: ExportFormat, organizationID?: number): void {
    this.view.setExporting(true);
    this.reportRepo.exportLevelisasi(filter, format, organizationID).subscribe({
      next: () => { this.view.setExporting(false); this.toast.success('Laporan berhasil diunduh'); },
      error: () => this.view.setExporting(false),
    });
  }
}
