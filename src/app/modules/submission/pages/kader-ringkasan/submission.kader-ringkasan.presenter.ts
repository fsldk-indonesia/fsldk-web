import { Injectable, inject } from '@angular/core';
import { switchMap, of } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { FORM_CODE_SENSUS_KADER } from '../../entities/submission';
import { SubmissionKaderRingkasanView } from './submission.kader-ringkasan.view';

@Injectable()
export class SubmissionKaderRingkasanPresenter extends BasePresenter<SubmissionKaderRingkasanView> {
  private submissionRepo = inject(SubmissionRepository);

  load(): void {
    this.view.setLoading(true);
    this.submissionRepo.findMine(FORM_CODE_SENSUS_KADER).pipe(
      switchMap((mine) => (mine ? this.submissionRepo.get(mine.submissionID) : of(null))),
    ).subscribe({
      next: (detail) => { this.view.setSubmission(detail); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
