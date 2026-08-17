import { Injectable, inject } from '@angular/core';
import { switchMap, of } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { SubmissionStatusView } from './submission.status.view';

@Injectable()
export class SubmissionStatusPresenter extends BasePresenter<SubmissionStatusView> {
  private submissionRepo = inject(SubmissionRepository);

  load(formCode: string): void {
    this.view.setLoading(true);
    this.submissionRepo.findMine(formCode).pipe(
      switchMap((mine) => (mine ? this.submissionRepo.get(mine.submissionID) : of(null))),
    ).subscribe({
      next: (detail) => { this.view.setSubmission(detail); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
