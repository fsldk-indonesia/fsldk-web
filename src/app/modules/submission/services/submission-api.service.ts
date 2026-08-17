import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import {
  SubmissionResponse, SubmissionDetail, ReviewRequest, EstablishLevelRequest, VersionedRequest, ReopenRequest,
} from '../entities/submission';

/** Panggilan HTTP mentah untuk pengisian, status, & review pendataan (/submissions). */
@Injectable({ providedIn: 'root' })
export class SubmissionApiService {
  private api = inject(ApiService);

  create(body: { formCode: string; organizationID?: number | null }): Observable<SubmissionResponse> {
    return this.api.post('/submissions', body);
  }
  saveAnswers(id: number, body: unknown): Observable<SubmissionDetail> { return this.api.put(`/submissions/${id}/answers`, body); }
  submit(id: number): Observable<SubmissionResponse> { return this.api.post(`/submissions/${id}/submit`); }
  cancel(id: number): Observable<unknown> { return this.api.post(`/submissions/${id}/cancel`); }
  list(formCode: string): Observable<Pagination<SubmissionResponse>> { return this.api.get('/submissions', { formCode, limit: 1 }); }
  /** Daftar terpaginasi untuk antrean reviewer — satu status per panggilan (backend tidak mendukung filter IN-list). */
  listQueue(q: { formCode?: string; status?: string; page?: number; limit?: number }): Observable<Pagination<SubmissionResponse>> {
    return this.api.get('/submissions', q);
  }
  get(id: number): Observable<SubmissionDetail> { return this.api.get(`/submissions/${id}`); }

  review(id: number, body: ReviewRequest): Observable<SubmissionResponse> { return this.api.post(`/submissions/${id}/review`, body); }
  establishLevel(id: number, body: EstablishLevelRequest): Observable<SubmissionResponse> { return this.api.post(`/submissions/${id}/establish-level`, body); }
  publish(id: number, body: VersionedRequest): Observable<SubmissionResponse> { return this.api.post(`/submissions/${id}/publish`, body); }
  reopen(id: number, body: ReopenRequest): Observable<SubmissionResponse> { return this.api.post(`/submissions/${id}/reopen`, body); }
  reassess(id: number, body: VersionedRequest): Observable<SubmissionResponse> { return this.api.post(`/submissions/${id}/reassess`, body); }
}
