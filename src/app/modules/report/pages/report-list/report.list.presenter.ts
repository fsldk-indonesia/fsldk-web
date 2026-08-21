import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { SubmissionRepository } from '../../../submission/repositories/submission.repository';
import { SubmissionFormRepository } from '../../../submission-form/repositories/submission-form.repository';
import { OrganizationRepository } from '../../../organization/repositories/organization.repository';
import { ReportRepository } from '../../repositories/report.repository';
import { FORM_CODE_LEVELISASI } from '../../../submission/entities/submission';
import { ExportFormat } from '../../entities/report';
import { ReportListView } from './report.list.view';

@Injectable()
export class ReportListPresenter extends BasePresenter<ReportListView> {
  private submissionRepo = inject(SubmissionRepository);
  private formRepo = inject(SubmissionFormRepository);
  private orgRepo = inject(OrganizationRepository);
  private reportRepo = inject(ReportRepository);
  private toast = inject(ToastService);

  private lastOrganizationID: number | undefined;

  loadAll(organizationID?: number): void {
    this.lastOrganizationID = organizationID;
    this.view.setLoading(true);
    this.submissionRepo.listAll(FORM_CODE_LEVELISASI, organizationID).subscribe({
      next: (page) => { this.view.setRows(page.data); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
    this.orgRepo.list({ limit: 200, organizationID }).subscribe({
      next: (page) => {
        const names: Record<number, string> = {};
        for (const o of page.data) names[o.organizationID] = o.organizationName;
        this.view.setOrgNames(names);
      },
      error: () => {},
    });
    this.formRepo.getPublishedByFormCode(FORM_CODE_LEVELISASI).subscribe({ next: (v) => this.view.setVersion(v), error: () => {} });
  }

  openDetail(id: number): void {
    this.submissionRepo.get(id).subscribe({ next: (d) => this.view.setDetail(d), error: () => {} });
  }

  export(status: string | undefined, format: ExportFormat): void {
    this.view.setExporting(true);
    this.reportRepo.export(FORM_CODE_LEVELISASI, status, format, this.lastOrganizationID).subscribe({
      next: () => { this.view.setExporting(false); this.toast.success('Laporan berhasil diunduh'); },
      error: () => this.view.setExporting(false),
    });
  }
}
