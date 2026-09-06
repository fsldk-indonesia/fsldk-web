import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { DynamicFormRepository } from '../../repositories/dynamic-form.repository';
import { DynamicFormResponseEditView } from './dynamicform.response-edit.view';

@Injectable()
export class DynamicFormResponseEditPresenter extends BasePresenter<DynamicFormResponseEditView> {
  private repo = inject(DynamicFormRepository);
  private toast = inject(ToastService);

  load(id: number, subId: number): void {
    this.repo.getSubmission(id, subId).subscribe({ next: (d) => this.view.setDetail(d), error: () => {} });
  }

  save(id: number, subId: number, fd: FormData): void {
    this.view.setSaving(true);
    this.repo.updateSubmission(id, subId, fd).subscribe({
      next: () => { this.toast.success('Tanggapan diperbarui'); this.view.setSaving(false); this.view.navigateBack(); },
      error: () => this.view.setSaving(false),
    });
  }
}
