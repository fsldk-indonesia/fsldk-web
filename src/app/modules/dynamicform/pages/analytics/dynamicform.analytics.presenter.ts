import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { DynamicFormRepository } from '../../repositories/dynamic-form.repository';
import { DynamicFormAnalyticsView } from './dynamicform.analytics.view';

@Injectable()
export class DynamicFormAnalyticsPresenter extends BasePresenter<DynamicFormAnalyticsView> {
  private repo = inject(DynamicFormRepository);

  load(id: number): void {
    this.repo.cmsGet(id).subscribe({ next: (f) => this.view.setForm(f), error: () => {} });
    this.repo.analytics(id).subscribe({ next: (d) => this.view.setAnalytics(d), error: () => {} });
  }
}
