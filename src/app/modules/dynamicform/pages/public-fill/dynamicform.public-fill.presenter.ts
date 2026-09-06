import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { FieldError } from '../../../../core/entities/api-response';
import { DynamicFormRepository } from '../../repositories/dynamic-form.repository';
import { ClosedReason, DynamicFormPublicFillView } from './dynamicform.public-fill.view';

const CODE_FORM_CLOSED = '42-CLOSED';

@Injectable()
export class DynamicFormPublicFillPresenter extends BasePresenter<DynamicFormPublicFillView> {
  private repo = inject(DynamicFormRepository);
  private slug = '';
  private draftEnabled = false;
  private draft$ = new Subject<Record<string, unknown>>();

  init(slug: string): void {
    this.slug = slug;
    // S2: draft autosave debounced 1500 ms (was 800).
    this.draft$.pipe(debounceTime(1500)).subscribe((answers) => this.saveDraft(answers));

    this.repo.publicGet(slug).subscribe({
      next: (form) => {
        this.draftEnabled = false; // set by the page once it knows login state
        this.view.setForm(form);
      },
      error: (err: HttpErrorResponse) => {
        const { message, reason } = closedFrom(err);
        this.view.showClosed(message, reason);
      },
    });
  }

  enableDraft(enabled: boolean): void { this.draftEnabled = enabled; }

  queueDraftSave(answers: Record<string, unknown>): void { this.draft$.next(answers); }

  flushDraftSave(answers: Record<string, unknown>): void { this.saveDraft(answers); }

  private saveDraft(answers: Record<string, unknown>): void {
    if (!this.draftEnabled) return;
    this.repo.saveDraft(this.slug, answers).subscribe({
      next: () => this.view.onDraftSaved(),
      error: () => {},
    });
  }

  stageFile(fieldID: number, file: File): void {
    this.repo.stageDraftFile(this.slug, fieldID, file).subscribe({
      next: (r) => this.view.onDraftFileStaged(fieldID, r.originalFileName),
      error: () => {},
    });
  }

  removeFile(fieldID: number): void {
    this.repo.removeDraftFile(this.slug, fieldID).subscribe({
      next: () => this.view.onDraftFileRemoved(fieldID),
      error: () => {},
    });
  }

  submit(fd: FormData): void {
    this.view.setSubmitting(true);
    this.repo.publicSubmit(this.slug, fd).subscribe({
      next: (res) => { this.view.setSubmitting(false); this.view.onSubmitSuccess(res); },
      error: (err: HttpErrorResponse) => {
        this.view.setSubmitting(false);
        const body = err.error;
        const errors: FieldError[] = Array.isArray(body?.errors) ? body.errors : [];
        if (err.status === 429) {
          const retry = Number(errors.find((e) => e.attribute === 'retryAfterSeconds')?.message ?? 60);
          this.view.onRateLimited(retry, body?.message ?? 'Terlalu banyak pengiriman.');
          return;
        }
        if (err.status === 409 || errors.some((e) => e.attribute === 'alreadySubmitted')) {
          this.view.showClosed(body?.message ?? 'Anda sudah pernah mengisi formulir ini.', 'already_submitted');
          return;
        }
        if (body?.code === CODE_FORM_CLOSED) {
          const reason = (errors.find((e) => e.attribute === 'closedReason')?.message ?? 'closed') as ClosedReason;
          this.view.showClosed(body?.message ?? 'Formulir ini sudah ditutup.', reason);
          return;
        }
        this.view.onValidationErrors(errors);
      },
    });
  }
}

/** Map a GET-form error to a closed message + machine reason (7 states). */
function closedFrom(err: HttpErrorResponse): { message: string; reason?: ClosedReason } {
  const body = err.error;
  const errors: FieldError[] = Array.isArray(body?.errors) ? body.errors : [];
  const tagged = errors.find((e) => e.attribute === 'closedReason')?.message as ClosedReason | undefined;
  if (err.status === 401) return { message: body?.message ?? 'Masuk untuk mengisi formulir ini.', reason: 'needs_login' };
  return { message: body?.message ?? 'Formulir tidak ditemukan atau sudah ditutup.', reason: tagged };
}
