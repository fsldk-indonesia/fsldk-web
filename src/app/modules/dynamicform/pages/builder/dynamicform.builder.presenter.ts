import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { DynamicFormRepository } from '../../repositories/dynamic-form.repository';
import { DynamicFormBuilderView } from './dynamicform.builder.view';

@Injectable()
export class DynamicFormBuilderPresenter extends BasePresenter<DynamicFormBuilderView> {
  private repo = inject(DynamicFormRepository);
  private toast = inject(ToastService);

  loadForm(id: number): void {
    this.repo.cmsGet(id).subscribe({ next: (f) => this.view.setForm(f), error: () => {} });
  }

  addField(id: number, body: unknown): void {
    this.view.setBusy(true);
    this.repo.addField(id, body).subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Field ditambahkan'); this.view.reload(); },
      error: () => this.view.setBusy(false),
    });
  }

  updateField(id: number, fieldID: number, body: unknown): void {
    this.view.setBusy(true);
    this.repo.updateField(id, fieldID, body).subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Field diperbarui'); this.view.reload(); },
      error: () => this.view.setBusy(false),
    });
  }

  removeField(id: number, fieldID: number): void {
    this.repo.removeField(id, fieldID).subscribe({
      next: () => { this.toast.success('Field dihapus'); this.view.reload(); },
      error: () => {},
    });
  }

  reorder(id: number, order: number[]): void {
    this.repo.reorderFields(id, order).subscribe({
      next: () => this.view.reload(),
      error: () => this.view.reload(),
    });
  }

  setStatus(id: number, status: string): void {
    this.repo.setStatus(id, status).subscribe({
      next: () => { this.toast.success('Status formulir diperbarui'); this.view.reload(); },
      error: () => {},
    });
  }
}
