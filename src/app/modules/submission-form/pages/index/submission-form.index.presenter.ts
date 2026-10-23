import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { SubmissionFormRepository } from '../../repositories/submission-form.repository';
import { SubmissionFormIndexView } from './submission-form.index.view';

@Injectable()
export class SubmissionFormIndexPresenter extends BasePresenter<SubmissionFormIndexView> {
  private repo = inject(SubmissionFormRepository);

  loadForms(): void {
    this.repo.listForms().subscribe({ next: (f) => this.view.setForms(f), error: () => {} });
  }
}
