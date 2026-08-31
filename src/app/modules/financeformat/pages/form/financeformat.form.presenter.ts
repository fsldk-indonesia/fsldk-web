import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { FinanceFormatRepository } from '../../repositories/financeformat.repository';
import { FinanceFormatFormView } from './financeformat.form.view';

export interface FinanceFormatFormValue {
  fileName: string;
  formatTypeID: number;
  fileURL: string;
}

export const emptyFinanceFormatForm: FinanceFormatFormValue = {
  fileName: '', formatTypeID: 0, fileURL: '',
};

@Injectable()
export class FinanceFormatFormPresenter extends BasePresenter<FinanceFormatFormView> {
  private repo = inject(FinanceFormatRepository);
  private toast = inject(ToastService);

  loadTypes(): void {
    this.repo.formatTypes().subscribe({ next: (t) => this.view.setTypes(t), error: () => {} });
  }

  loadForEdit(id: number): void {
    this.repo.cmsGet(id).subscribe({
      next: (f) => this.view.setForm({ fileName: f.fileName, formatTypeID: f.formatTypeID, fileURL: f.fileURL }),
      error: () => {},
    });
  }

  save(editId: number | null, form: FinanceFormatFormValue): void {
    if (form.fileName.trim().length < 3) {
      this.toast.error('Nama file minimal 3 karakter');
      return;
    }
    if (!form.formatTypeID) {
      this.toast.error('Kategori format wajib dipilih');
      return;
    }
    // Mirror of the server-side rule (financeformat_service): Excel workbooks only.
    if (!form.fileURL.toLowerCase().endsWith('.xlsx')) {
      this.toast.error('Berkas wajib berformat Excel (.xlsx)');
      return;
    }
    this.view.setSaving(true);
    const body = { fileName: form.fileName.trim(), formatTypeID: +form.formatTypeID, fileURL: form.fileURL };
    const done = () => { this.toast.success('Format keuangan disimpan'); this.view.setSaving(false); this.view.navigateToIndex(); };
    if (editId) {
      this.repo.update(editId, body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    } else {
      this.repo.create(body).subscribe({ next: done, error: () => this.view.setSaving(false) });
    }
  }
}
