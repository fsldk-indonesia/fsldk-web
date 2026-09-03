import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DynamicFormApiService } from '../services/dynamic-form-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { DynamicForm, GSheetStatus, PublicDynamicForm, SubmitResult } from '../entities/dynamic-form';
import { DynamicFormField } from '../entities/dynamic-form-field';
import { DynamicFormSubmissionDetail, DynamicFormSubmissionRow } from '../entities/dynamic-form-submission';
import { DynamicFormAnalytics } from '../entities/dynamic-form-analytics';

/** The dynamicform module's public data API — a thin wrapper the rest of the app injects. */
@Injectable({ providedIn: 'root' })
export class DynamicFormRepository {
  private api = inject(DynamicFormApiService);

  cmsList(q: Record<string, unknown>): Observable<Pagination<DynamicForm>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<DynamicForm> { return this.api.cmsGet(id); }
  create(body: unknown): Observable<DynamicForm> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<DynamicForm> { return this.api.update(id, body); }
  setStatus(id: number, status: string): Observable<unknown> { return this.api.setStatus(id, status); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
  bulkDelete(ids: number[]): Observable<{ deleted: number[]; skipped: number[] }> { return this.api.bulkDelete(ids); }

  addField(id: number, body: unknown): Observable<DynamicFormField> { return this.api.addField(id, body); }
  updateField(id: number, fieldID: number, body: unknown): Observable<DynamicFormField> { return this.api.updateField(id, fieldID, body); }
  removeField(id: number, fieldID: number): Observable<unknown> { return this.api.removeField(id, fieldID); }
  reorderFields(id: number, order: number[]): Observable<unknown> { return this.api.reorderFields(id, order); }

  listSubmissions(id: number, q: Record<string, unknown>): Observable<Pagination<DynamicFormSubmissionRow>> { return this.api.listSubmissions(id, q); }
  getSubmission(id: number, subId: number): Observable<DynamicFormSubmissionDetail> { return this.api.getSubmission(id, subId); }
  updateSubmission(id: number, subId: number, fd: FormData): Observable<unknown> { return this.api.updateSubmission(id, subId, fd); }
  deleteSubmission(id: number, subId: number): Observable<unknown> { return this.api.deleteSubmission(id, subId); }
  deleteResponses(id: number): Observable<unknown> { return this.api.deleteResponses(id); }
  analytics(id: number): Observable<DynamicFormAnalytics> { return this.api.analytics(id); }
  exportCsv(id: number): Observable<{ blob: Blob; filename: string }> { return this.api.exportCsv(id); }

  gsheetConnect(id: number): Observable<GSheetStatus> { return this.api.gsheetConnect(id); }
  gsheetResync(id: number): Observable<GSheetStatus> { return this.api.gsheetResync(id); }
  gsheetDisconnect(id: number): Observable<GSheetStatus> { return this.api.gsheetDisconnect(id); }

  publicGet(slug: string): Observable<PublicDynamicForm> { return this.api.publicGet(slug); }
  publicSubmit(slug: string, fd: FormData): Observable<SubmitResult> { return this.api.publicSubmit(slug, fd); }
  saveDraft(slug: string, answers: Record<string, unknown>): Observable<unknown> { return this.api.saveDraft(slug, answers); }
  stageDraftFile(slug: string, fieldID: number, file: File): Observable<{ originalFileName: string }> { return this.api.stageDraftFile(slug, fieldID, file); }
  removeDraftFile(slug: string, fieldID: number): Observable<unknown> { return this.api.removeDraftFile(slug, fieldID); }
}
