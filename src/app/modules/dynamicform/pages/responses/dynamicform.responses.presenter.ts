import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { Pagination } from '../../../../core/entities/pagination';
import { CmsListParams } from '../../../../shared/cms-index/cms-index.types';
import { DynamicFormRepository } from '../../repositories/dynamic-form.repository';
import { DynamicFormSubmissionRow } from '../../entities/dynamic-form-submission';
import { DynamicFormResponsesView } from './dynamicform.responses.view';

@Injectable()
export class DynamicFormResponsesPresenter extends BasePresenter<DynamicFormResponsesView> {
  private repo = inject(DynamicFormRepository);
  private toast = inject(ToastService);

  loadForm(id: number): void {
    this.repo.cmsGet(id).subscribe({ next: (f) => this.view.setForm(f), error: () => {} });
  }

  /** dataSource untuk <app-cms-index> — memetakan CmsListParams generik ke
   *  query param dynamicform_dto.SubmissionFilter. Status di sini bukan
   *  string enum, tapi boolean isValid — dipetakan lewat pola "1 dicentang
   *  = true/false, selain itu kosongkan" (beda dari Status Formulir yang
   *  genuinely multi-select), sama seperti isActive di modul lain. Backend
   *  tidak punya kolom sort dinamis untuk rekap (selalu submittedDate DESC),
   *  jadi `sort` tidak ikut dikirim & semua kolom di config diset sortable:false. */
  list(id: number, params: CmsListParams): Observable<Pagination<DynamicFormSubmissionRow>> {
    const validOnly = params.status.length === 1 ? params.status[0] === 'valid' : undefined;
    return this.repo.listSubmissions(id, {
      page: params.page, limit: params.limit,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
      search: (params.filters['search'] ?? [])[0] ?? '',
      validOnly,
    });
  }

  deleteSubmission(id: number, subId: number): void {
    this.repo.deleteSubmission(id, subId).subscribe({
      next: () => { this.toast.success('Tanggapan dihapus'); this.view.onMutated(); },
      error: () => {},
    });
  }

  bulkDelete(id: number, subIds: number[]): void {
    this.repo.bulkDeleteSubmissions(id, subIds).subscribe({
      next: (r) => {
        this.toast.success(`${r.deleted.length} tanggapan dihapus${r.skipped.length ? `, ${r.skipped.length} dilewati` : ''}`);
        this.view.onMutated();
      },
      error: () => {},
    });
  }

  deleteAll(id: number): void {
    this.repo.deleteResponses(id).subscribe({
      next: () => { this.toast.success('Semua tanggapan dihapus'); this.view.onMutated(); },
      error: () => {},
    });
  }

  exportCsv(id: number): void {
    this.repo.exportCsv(id).subscribe({
      next: ({ blob, filename }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'responses.csv';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('Gagal mengunduh CSV'),
    });
  }
}
