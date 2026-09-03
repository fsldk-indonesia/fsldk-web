import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { DynamicForm, GSheetStatus, PublicDynamicForm, SubmitResult } from '../entities/dynamic-form';
import { DynamicFormField } from '../entities/dynamic-form-field';
import { DynamicFormSubmissionDetail, DynamicFormSubmissionRow } from '../entities/dynamic-form-submission';
import { DynamicFormAnalytics } from '../entities/dynamic-form-analytics';

/** Raw HTTP calls for the dynamic form module — CMS + public. One method per endpoint. */
@Injectable({ providedIn: 'root' })
export class DynamicFormApiService {
  private api = inject(ApiService);
  private base = '/dynamic-forms';
  private pub = '/public/dynamic-forms';

  // --- CMS: forms ---
  cmsList(q: Record<string, unknown>): Observable<Pagination<DynamicForm>> { return this.api.get(this.base, q); }
  cmsGet(id: number): Observable<DynamicForm> { return this.api.get(`${this.base}/${id}`); }
  create(body: unknown): Observable<DynamicForm> { return this.api.post(this.base, body); }
  update(id: number, body: unknown): Observable<DynamicForm> { return this.api.put(`${this.base}/${id}`, body); }
  setStatus(id: number, status: string): Observable<unknown> { return this.api.patch(`${this.base}/${id}/status`, { status }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`${this.base}/${id}`); }
  bulkDelete(ids: number[]): Observable<{ deleted: number[]; skipped: number[] }> { return this.api.post(`${this.base}/bulk-delete`, { ids }); }

  // --- CMS: builder ---
  addField(id: number, body: unknown): Observable<DynamicFormField> { return this.api.post(`${this.base}/${id}/fields`, body); }
  updateField(id: number, fieldID: number, body: unknown): Observable<DynamicFormField> { return this.api.put(`${this.base}/${id}/fields/${fieldID}`, body); }
  removeField(id: number, fieldID: number): Observable<unknown> { return this.api.delete(`${this.base}/${id}/fields/${fieldID}`); }
  reorderFields(id: number, order: number[]): Observable<unknown> { return this.api.post(`${this.base}/${id}/fields/reorder`, { order }); }

  // --- CMS: rekap / analytics / export ---
  listSubmissions(id: number, q: Record<string, unknown>): Observable<Pagination<DynamicFormSubmissionRow>> { return this.api.get(`${this.base}/${id}/submissions`, q); }
  getSubmission(id: number, subId: number): Observable<DynamicFormSubmissionDetail> { return this.api.get(`${this.base}/${id}/submissions/${subId}`); }
  updateSubmission(id: number, subId: number, fd: FormData): Observable<unknown> { return this.api.put(`${this.base}/${id}/submissions/${subId}`, fd); }
  deleteSubmission(id: number, subId: number): Observable<unknown> { return this.api.delete(`${this.base}/${id}/submissions/${subId}`); }
  deleteResponses(id: number): Observable<unknown> { return this.api.delete(`${this.base}/${id}/submissions`); }
  analytics(id: number): Observable<DynamicFormAnalytics> { return this.api.get(`${this.base}/${id}/analytics`); }
  exportCsv(id: number): Observable<{ blob: Blob; filename: string }> { return this.api.getBlob(`${this.base}/${id}/responses.csv`); }

  // --- CMS: Google Sheets ---
  gsheetConnect(id: number): Observable<GSheetStatus> { return this.api.post(`${this.base}/${id}/gsheet/connect`); }
  gsheetResync(id: number): Observable<GSheetStatus> { return this.api.post(`${this.base}/${id}/gsheet/resync`); }
  gsheetDisconnect(id: number): Observable<GSheetStatus> { return this.api.delete(`${this.base}/${id}/gsheet`); }

  // --- public ---
  // silent: the fill page renders its own "closed / login required" cards, so
  // the global error toast would just be noise.
  publicGet(slug: string): Observable<PublicDynamicForm> { return this.api.get(`${this.pub}/${slug}`, undefined, { silent: true }); }
  publicSubmit(slug: string, fd: FormData): Observable<SubmitResult> { return this.api.post(`${this.pub}/${slug}/submit`, fd); }
  saveDraft(slug: string, answers: Record<string, unknown>): Observable<unknown> { return this.api.post(`${this.pub}/${slug}/draft`, { answers }); }
  stageDraftFile(slug: string, fieldID: number, file: File): Observable<{ originalFileName: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.api.post(`${this.pub}/${slug}/draft/file/${fieldID}`, fd);
  }
  removeDraftFile(slug: string, fieldID: number): Observable<unknown> { return this.api.delete(`${this.pub}/${slug}/draft/file/${fieldID}`); }
}
