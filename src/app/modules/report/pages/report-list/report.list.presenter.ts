import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { SubmissionRepository } from '../../../submission/repositories/submission.repository';
import { SubmissionFormRepository } from '../../../submission-form/repositories/submission-form.repository';
import { ReportRepository } from '../../repositories/report.repository';
import { FORM_CODE_LEVELISASI, SubmissionResponse } from '../../../submission/entities/submission';
import { ExportFormat } from '../../entities/report';
import { ReportListView } from './report.list.view';

@Injectable()
export class ReportListPresenter extends BasePresenter<ReportListView> {
  private submissionRepo = inject(SubmissionRepository);
  private formRepo = inject(SubmissionFormRepository);
  private reportRepo = inject(ReportRepository);
  private toast = inject(ToastService);

  /** Diperbarui tiap kali <app-cms-index> memuat data (lihat list()) — dipakai
   *  export() supaya cakupan organisasi ekspor selalu mengikuti org-switcher
   *  terkini, sama seperti perilaku lama (loadAll(organizationID)). */
  private lastOrganizationID: number | undefined;

  loadVersion(): void {
    this.formRepo.getPublishedByFormCode(FORM_CODE_LEVELISASI).subscribe({ next: (v) => this.view.setVersion(v), error: () => {} });
  }

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  GET /submissions yang sekarang mendukung page/limit/sort, filter Status
   *  multi-select (IN-list backend), dan search nama/kode LDK (LEFT JOIN
   *  ms_organization) — lihat submission.repository.ts & submission_handler_impl.go.
   *  organizationID = hasil org-switcher shell cms-puskomda (selalu undefined
   *  di shell cms-puskomnas, tidak ada switcher di sana — lihat
   *  report.list.page.ts & org-context.service.ts). */
  list(params: CmsListParams, organizationID?: number): Observable<Pagination<SubmissionResponse>> {
    this.lastOrganizationID = organizationID;
    return this.submissionRepo.listAll(FORM_CODE_LEVELISASI, {
      page: params.page,
      limit: params.limit,
      sort: params.sort,
      status: params.status,
      search: (params.filters['search'] ?? [])[0] ?? '',
    }, organizationID);
  }

  openDetail(id: number): void {
    this.submissionRepo.get(id).subscribe({
      next: (d) => this.view.setDetail(d),
      error: () => this.view.onDetailError(),
    });
  }

  /** Toolbar "Filter Status"/"Format Ekspor" di atas tabel sengaja TERPISAH
   *  dari filter Status bawaan <app-cms-index> (yang hanya menyaring tampilan
   *  tabel) — ini murni menentukan cakupan berkas ekspor, satu status
   *  tunggal seperti sebelumnya (backend /reports/submissions/export belum
   *  mendukung multi-status IN-list). */
  export(status: string | undefined, format: ExportFormat): void {
    this.view.setExporting(true);
    this.reportRepo.export(FORM_CODE_LEVELISASI, status, format, this.lastOrganizationID).subscribe({
      next: () => { this.view.setExporting(false); this.toast.success('Laporan berhasil diunduh'); },
      error: () => this.view.setExporting(false),
    });
  }
}
