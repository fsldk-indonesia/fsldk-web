import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { DynamicFormRepository } from '../../repositories/dynamic-form.repository';
import { DynamicForm } from '../../entities/dynamic-form';
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

  /** Header image lives on the form (not a field). Round-trip the current
   *  metadata so a PUT that only changes headerImageUrl keeps everything else. */
  setHeaderImage(id: number, url: string, form: DynamicForm): void {
    this.repo.update(id, {
      title: form.title,
      description: form.description || null,
      headerImageUrl: url || null,
      maxSubmission: form.maxSubmission,
      isMultipleSubmit: form.isMultipleSubmit,
      requireLogin: form.requireLogin,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      confirmationMessage: form.confirmationMessage || null,
      redirectUrl: form.redirectUrl || null,
      notifyEmails: form.notifyEmails ?? [],
      sendConfirmationEmail: form.sendConfirmationEmail,
      rateLimitPerIP: form.rateLimitPerIP,
      rateLimitWindowMinutes: form.rateLimitWindowMinutes,
      gsheetEnabled: form.gsheetEnabled,
    }).subscribe({
      next: () => { this.toast.success(url ? 'Gambar header diperbarui' : 'Gambar header dihapus'); this.view.reload(); },
      error: () => {},
    });
  }
}
