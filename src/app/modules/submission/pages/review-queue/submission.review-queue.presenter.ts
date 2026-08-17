import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { SubmissionFormRepository } from '../../../submission-form/repositories/submission-form.repository';
import { OrganizationRepository } from '../../../organization/repositories/organization.repository';
import { ReviewRequest, FORM_CODE_LEVELISASI } from '../../entities/submission';
import { SubmissionReviewQueueView } from './submission.review-queue.view';

@Injectable()
export class SubmissionReviewQueuePresenter extends BasePresenter<SubmissionReviewQueueView> {
  private submissionRepo = inject(SubmissionRepository);
  private formRepo = inject(SubmissionFormRepository);
  private orgRepo = inject(OrganizationRepository);
  private toast = inject(ToastService);

  loadQueue(statuses: string[]): void {
    this.view.setLoading(true);
    forkJoin(statuses.map((s) => this.submissionRepo.listByStatus(FORM_CODE_LEVELISASI, s))).subscribe({
      next: (pages) => {
        this.view.setQueue(pages.flatMap((p) => p.data));
        this.view.setLoading(false);
      },
      error: () => this.view.setLoading(false),
    });
    this.orgRepo.list({ limit: 200 }).subscribe({
      next: (page) => {
        const names: Record<number, string> = {};
        for (const o of page.data) names[o.organizationID] = o.organizationName;
        this.view.setOrgNames(names);
      },
      error: () => {},
    });
    this.formRepo.getPublishedByFormCode(FORM_CODE_LEVELISASI).subscribe({
      next: (v) => this.view.setVersion(v),
      error: () => {},
    });
  }

  openDetail(id: number): void {
    this.submissionRepo.get(id).subscribe({ next: (d) => this.view.setDetail(d), error: () => {} });
  }

  submitDecision(id: number, body: ReviewRequest, statuses: string[]): void {
    this.view.setBusy(true);
    this.submissionRepo.review(id, body).subscribe({
      next: () => {
        this.view.setBusy(false);
        this.toast.success('Keputusan berhasil dikirim');
        this.view.onDecisionSuccess();
        this.loadQueue(statuses);
      },
      error: () => this.view.setBusy(false),
    });
  }
}
