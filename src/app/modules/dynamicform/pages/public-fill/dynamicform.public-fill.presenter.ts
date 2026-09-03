import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime } from 'rxjs';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { FieldError } from '../../../../core/entities/api-response';
import { DynamicFormRepository } from '../../repositories/dynamic-form.repository';
import { DynamicFormPublicFillView } from './dynamicform.public-fill.view';

@Injectable()
export class DynamicFormPublicFillPresenter extends BasePresenter<DynamicFormPublicFillView> {
  private repo = inject(DynamicFormRepository);
  private slug = '';
  private draftEnabled = false;
  private draft$ = new Subject<Record<string, unknown>>();

  init(slug: string): void {
    this.slug = slug;
    this.draft$.pipe(debounceTime(800)).subscribe((answers) => {
      if (this.draftEnabled) this.repo.saveDraft(this.slug, answers).subscribe({ next: () => {}, error: () => {} });
    });

    this.repo.publicGet(slug).subscribe({
      next: (form) => {
        this.draftEnabled = false; // set by the page once it knows login state
        this.view.setForm(form);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.view.redirectToLogin(`/form/${slug}`);
          return;
        }
        const msg = err.error?.message || 'Formulir tidak ditemukan atau sudah ditutup.';
        this.view.showClosed(msg);
      },
    });
  }

  enableDraft(enabled: boolean): void { this.draftEnabled = enabled; }

  queueDraftSave(answers: Record<string, unknown>): void { this.draft$.next(answers); }

  flushDraftSave(answers: Record<string, unknown>): void {
    if (this.draftEnabled) this.repo.saveDraft(this.slug, answers).subscribe({ next: () => {}, error: () => {} });
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
        if (body?.code === CODE_FORM_CLOSED || errors.some((e) => e.attribute === 'formClosed')) {
          this.view.showClosed(body?.message ?? 'Formulir ini sudah ditutup.');
          return;
        }
        if (err.status === 409 || errors.some((e) => e.attribute === 'alreadySubmitted')) {
          this.view.showClosed(body?.message ?? 'Anda sudah pernah mengisi formulir ini.');
          return;
        }
        this.view.onValidationErrors(errors);
      },
    });
  }
}

const CODE_FORM_CLOSED = '42-CLOSED';
