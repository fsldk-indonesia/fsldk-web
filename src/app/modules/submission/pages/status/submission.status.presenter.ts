import { Injectable, inject } from '@angular/core';
import { switchMap, of } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { SubmissionStatusView } from './submission.status.view';

@Injectable()
export class SubmissionStatusPresenter extends BasePresenter<SubmissionStatusView> {
  private submissionRepo = inject(SubmissionRepository);
  private toast = inject(ToastService);

  load(formCode: string): void {
    this.view.setLoading(true);
    this.submissionRepo.findMine(formCode).pipe(
      switchMap((mine) => (mine ? this.submissionRepo.get(mine.submissionID) : of(null))),
    ).subscribe({
      next: (detail) => { this.view.setSubmission(detail); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  reassess(id: number, version: number): void {
    this.view.setBusy(true);
    this.submissionRepo.reassess(id, { version }).subscribe({
      next: (res) => {
        this.view.setBusy(false);
        this.toast.success('Reassessment diajukan — silakan isi ulang form Levelisasi');
        this.load(res.formCode);
      },
      error: () => this.view.setBusy(false),
    });
  }
}
