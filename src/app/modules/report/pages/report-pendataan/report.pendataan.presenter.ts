import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { ReportRepository } from '../../repositories/report.repository';
import { ReportFilterValue, ExportFormat } from '../../entities/report';
import { ReportPendataanView } from './report.pendataan.view';

@Injectable()
export class ReportPendataanPresenter extends BasePresenter<ReportPendataanView> {
  private reportRepo = inject(ReportRepository);
  private toast = inject(ToastService);

  show(filter: ReportFilterValue, organizationID?: number): void {
    this.view.setLoading(true);
    this.reportRepo.listPendataan(filter, organizationID).subscribe({
      next: (tabs) => { this.view.setTabs(tabs); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  download(filter: ReportFilterValue, format: ExportFormat, organizationID?: number): void {
    this.view.setExporting(true);
    this.reportRepo.exportPendataan(filter, format, organizationID).subscribe({
      next: () => { this.view.setExporting(false); this.toast.success('Laporan berhasil diunduh'); },
      error: () => this.view.setExporting(false),
    });
  }
}
