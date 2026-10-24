import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { SubmissionFormRepository } from '../../../submission-form/repositories/submission-form.repository';
import { ReviewRequest, FORM_CODE_LEVELISASI } from '../../entities/submission';
import { SubmissionReviewQueueView } from './submission.review-queue.view';

@Injectable()
export class SubmissionReviewQueuePresenter extends BasePresenter<SubmissionReviewQueueView> {
  private submissionRepo = inject(SubmissionRepository);
  private formRepo = inject(SubmissionFormRepository);
  private orgContext = inject(OrgContextService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  loadQueue(statuses: string[]): void {
    this.view.setLoading(true);
    this.orgContext.organizationID$(this.route).subscribe((organizationID) => {
      forkJoin(statuses.map((s) => this.submissionRepo.listByStatus(FORM_CODE_LEVELISASI, s, organizationID))).subscribe({
        next: (pages) => {
          const items = pages.flatMap((p) => p.data);
          this.view.setQueue(items);
          const names: Record<number, string> = {};
          for (const it of items) if (it.organizationName) names[it.organizationID] = it.organizationName;
          this.view.setOrgNames(names);
          this.view.setLoading(false);
        },
        error: () => this.view.setLoading(false),
      });
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

  saveFieldScores(id: number, scores: { fieldID: number; rawScore: number }[]): void {
    this.view.setBusy(true);
    this.submissionRepo.saveFieldScores(id, { scores }).subscribe({
      next: (d) => { this.view.setBusy(false); this.toast.success('Skor berhasil disimpan'); this.view.setDetail(d); },
      error: () => this.view.setBusy(false),
    });
  }
}
