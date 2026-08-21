import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { SubmissionFormRepository } from '../../repositories/submission-form.repository';
import { SubmissionFormIndexView } from './submission-form.index.view';

export interface FormFormValue {
  formCode: string;
  formName: string;
  description: string;
}

@Injectable()
export class SubmissionFormIndexPresenter extends BasePresenter<SubmissionFormIndexView> {
  private repo = inject(SubmissionFormRepository);
  private toast = inject(ToastService);

  loadForms(): void {
    this.repo.listForms().subscribe({ next: (f) => this.view.setForms(f), error: () => {} });
  }

  save(form: FormFormValue): void {
    this.view.setSaving(true);
    this.repo.createForm(form).subscribe({
      next: () => {
        this.toast.success('Form dibuat');
        this.view.setSaving(false);
        this.view.onSaveSuccess();
      },
      error: () => this.view.setSaving(false),
    });
  }
}
