import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { DynamicFormRepository } from '../../repositories/dynamic-form.repository';
import { DynamicFormResponsesView } from './dynamicform.responses.view';

@Injectable()
export class DynamicFormResponsesPresenter extends BasePresenter<DynamicFormResponsesView> {
  private repo = inject(DynamicFormRepository);
  private toast = inject(ToastService);

  loadForm(id: number): void {
    this.repo.cmsGet(id).subscribe({ next: (f) => this.view.setForm(f), error: () => {} });
  }

  load(id: number, page: number, limit: number, search: string, validOnly: boolean): void {
    this.repo.listSubmissions(id, { page, limit, search, validOnly: validOnly || undefined }).subscribe({
      next: (p) => this.view.setSubmissions(p.data, p.count),
      error: () => {},
    });
  }

  deleteSubmission(id: number, subId: number): void {
    this.repo.deleteSubmission(id, subId).subscribe({
      next: () => { this.toast.success('Tanggapan dihapus'); this.view.onMutated(); },
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
