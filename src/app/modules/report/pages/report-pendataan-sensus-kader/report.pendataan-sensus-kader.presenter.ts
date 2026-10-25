import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ReportRepository } from '../../repositories/report.repository';
import { KaderFilterValue, ExportFormat } from '../../entities/report';
import { ReportPendataanSensusKaderView } from './report.pendataan-sensus-kader.view';

@Injectable()
export class ReportPendataanSensusKaderPresenter extends BasePresenter<ReportPendataanSensusKaderView> {
  private reportRepo = inject(ReportRepository);
  private toast = inject(ToastService);

  show(filter: KaderFilterValue, organizationID?: number): void {
    this.view.setLoading(true);
    this.reportRepo.listPendataanSensusKader(filter, organizationID).subscribe({
      next: (tabs) => { this.view.setTabs(tabs); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  download(filter: KaderFilterValue, format: ExportFormat, organizationID?: number): void {
    this.view.setExporting(true);
    this.reportRepo.exportPendataanSensusKader(filter, format, organizationID).subscribe({
      next: () => { this.view.setExporting(false); this.toast.success('Laporan berhasil diunduh'); },
      error: () => this.view.setExporting(false),
    });
  }
}
