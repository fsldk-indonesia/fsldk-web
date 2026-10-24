import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { OrgContextService } from '../../../../core/services/org-context.service';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { SubmissionFormRepository } from '../../../submission-form/repositories/submission-form.repository';
import { FORM_CODE_LEVELISASI } from '../../entities/submission';
import { SubmissionPublikasiView } from './submission.publikasi.view';

const QUEUE_STATUSES = ['LEVEL_ESTABLISHED', 'PUBLISHED'];

@Injectable()
export class SubmissionPublikasiPresenter extends BasePresenter<SubmissionPublikasiView> {
  private submissionRepo = inject(SubmissionRepository);
  private formRepo = inject(SubmissionFormRepository);
  private orgContext = inject(OrgContextService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  loadQueue(): void {
    this.view.setLoading(true);
    this.orgContext.organizationID$(this.route).subscribe((organizationID) => {
      forkJoin(QUEUE_STATUSES.map((s) => this.submissionRepo.listByStatus(FORM_CODE_LEVELISASI, s, organizationID))).subscribe({
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
    this.formRepo.getPublishedByFormCode(FORM_CODE_LEVELISASI).subscribe({ next: (v) => this.view.setVersion(v), error: () => {} });
  }

  openDetail(id: number): void {
    this.submissionRepo.get(id).subscribe({ next: (d) => this.view.setDetail(d), error: () => {} });
  }

  publish(id: number, version: number): void {
    this.view.setBusy(true);
    this.submissionRepo.publish(id, { version }).subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Hasil berhasil dipublikasikan'); this.view.onActionSuccess(); this.loadQueue(); },
      error: () => this.view.setBusy(false),
    });
  }

  reopen(id: number, reason: string, version: number): void {
    this.view.setBusy(true);
    this.submissionRepo.reopen(id, { reason, version }).subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Submission dibuka kembali untuk koreksi'); this.view.onActionSuccess(); this.loadQueue(); },
      error: () => this.view.setBusy(false),
    });
  }

  reassess(id: number, version: number): void {
    this.view.setBusy(true);
    this.submissionRepo.reassess(id, { version }).subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Reassessment diajukan'); this.view.onActionSuccess(); this.loadQueue(); },
      error: () => this.view.setBusy(false),
    });
  }
}
