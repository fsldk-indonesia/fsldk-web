import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of, switchMap, map } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { ToastService } from '../../../../core/services/toast.service';
import { FieldError } from '../../../../core/entities/api-response';
import { SubmissionFormRepository } from '../../../submission-form/repositories/submission-form.repository';
import { OrganizationRepository } from '../../../organization/repositories/organization.repository';
import { SubmissionRepository } from '../../repositories/submission.repository';
import { SubmissionPendataanView } from './submission.pendataan.view';

/** Ekstrak detail error per field dari response 400/422 — lihat pola yang
 *  sama di dynamicform.public-fill.presenter.ts. */
function fieldErrorsOf(err: HttpErrorResponse): FieldError[] {
  const errors = err.error?.errors;
  return Array.isArray(errors) ? errors : [];
}

@Injectable()
export class SubmissionPendataanPresenter extends BasePresenter<SubmissionPendataanView> {
  private formRepo = inject(SubmissionFormRepository);
  private orgRepo = inject(OrganizationRepository);
  private submissionRepo = inject(SubmissionRepository);
  private toast = inject(ToastService);

  loadAll(formCode: string, organizationID?: number): void {
    this.view.setLoading(true);
    forkJoin({
      version: this.formRepo.getPublishedByFormCode(formCode),
      mine: this.submissionRepo.findMine(formCode, organizationID),
    }).pipe(
      switchMap(({ version, mine }) =>
        mine ? this.submissionRepo.get(mine.submissionID).pipe(map((detail) => ({ version, detail }))) : of({ version, detail: null }),
      ),
    ).subscribe({
      next: ({ version, detail }) => {
        this.view.setVersion(version);
        this.view.setSubmission(detail);
        this.view.setLoading(false);
      },
      error: () => this.view.setLoading(false),
    });
  }

  loadLdkOptions(): void {
    this.orgRepo.directory('LDK').subscribe({
      next: (list) => this.view.setLdkOptions(list.map((o) => ({
        value: o.organizationID,
        label: o.parentOrganizationName ? `${o.organizationName} — ${o.parentOrganizationName}` : o.organizationName,
      }))),
      error: () => {},
    });
  }

  create(formCode: string, organizationID: number | null, targetOrganizationID?: number): void {
    this.view.setBusy(true);
    this.submissionRepo.create(formCode, organizationID, targetOrganizationID).subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Pendataan dimulai'); this.view.reload(); },
      error: () => this.view.setBusy(false),
    });
  }

  saveAnswers(id: number, answers: unknown[], onDone?: () => void): void {
    this.view.setBusy(true);
    this.submissionRepo.saveAnswers(id, { answers }).subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Draf jawaban tersimpan'); onDone?.(); },
      error: (err: HttpErrorResponse) => { this.view.setBusy(false); this.view.onValidationErrors(fieldErrorsOf(err)); },
    });
  }

  submit(id: number, answers: unknown[]): void {
    this.view.setBusy(true);
    this.submissionRepo.saveAnswers(id, { answers }).subscribe({
      next: () => {
        this.submissionRepo.submit(id).subscribe({
          next: () => { this.view.setBusy(false); this.toast.success('Pendataan berhasil dikirim'); this.view.reload(); },
          error: (err: HttpErrorResponse) => { this.view.setBusy(false); this.view.onValidationErrors(fieldErrorsOf(err)); },
        });
      },
      error: (err: HttpErrorResponse) => { this.view.setBusy(false); this.view.onValidationErrors(fieldErrorsOf(err)); },
    });
  }

  cancel(id: number): void {
    this.view.setBusy(true);
    this.submissionRepo.cancel(id).subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Pendataan dibatalkan'); this.view.reload(); },
      error: () => this.view.setBusy(false),
    });
  }

  reassessKader(id: number, version: number): void {
    this.view.setBusy(true);
    this.submissionRepo.reassessKader(id, { version }).subscribe({
      next: () => { this.view.setBusy(false); this.toast.success('Silakan isi ulang data terbaru Anda'); this.view.reload(); },
      error: () => this.view.setBusy(false),
    });
  }
}
