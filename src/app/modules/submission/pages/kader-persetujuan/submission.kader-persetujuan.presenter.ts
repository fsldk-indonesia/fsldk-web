import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { KaderRepository } from '../../repositories/kader.repository';
import { SubmissionFormRepository } from '../../../submission-form/repositories/submission-form.repository';
import { ReviewRequest, FORM_CODE_SENSUS_KADER } from '../../entities/submission';
import { SubmissionKaderPersetujuanView } from './submission.kader-persetujuan.view';

@Injectable()
export class SubmissionKaderPersetujuanPresenter extends BasePresenter<SubmissionKaderPersetujuanView> {
  private submissionRepo = inject(SubmissionRepository);
  private kaderRepo = inject(KaderRepository);
  private formRepo = inject(SubmissionFormRepository);
  private orgContext = inject(OrgContextService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  private currentOrganizationID: number | undefined;

  loadAll(): void {
    this.orgContext.organizationID$(this.route).subscribe((organizationID) => {
      this.currentOrganizationID = organizationID;
      this.view.setLoading(true);
      this.kaderRepo.list('PENDING', organizationID).subscribe({
        next: (page) => { this.view.setPending(page.data); this.view.setLoading(false); },
        error: () => this.view.setLoading(false),
      });
      this.kaderRepo.list('ACTIVE', organizationID).subscribe({ next: (page) => this.view.setActive(page.data), error: () => {} });
    });
    this.formRepo.getPublishedByFormCode(FORM_CODE_SENSUS_KADER).subscribe({
      next: (v) => this.view.setVersion(v),
      error: () => {},
    });
  }

  openDetail(submissionID: number): void {
    this.submissionRepo.get(submissionID).subscribe({ next: (d) => this.view.setDetail(d), error: () => {} });
  }

  submitDecision(submissionID: number, body: ReviewRequest): void {
    this.view.setBusy(true);
    this.submissionRepo.review(submissionID, body).subscribe({
      next: () => {
        this.view.setBusy(false);
        this.toast.success('Keputusan berhasil dikirim');
        this.view.onDecisionSuccess();
        this.loadAll();
      },
      error: () => this.view.setBusy(false),
    });
  }

  deactivate(kaderID: number): void {
    this.kaderRepo.deactivate(kaderID).subscribe({
      next: () => { this.toast.success('Kader dinonaktifkan'); this.view.onDeactivateSuccess(); this.loadAll(); },
      error: () => {},
    });
  }
}
