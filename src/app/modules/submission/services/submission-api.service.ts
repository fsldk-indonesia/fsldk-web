import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { SubmissionResponse, SubmissionDetail } from '../entities/submission';

/** Panggilan HTTP mentah untuk pengisian & status pendataan (/submissions). */
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
  get(id: number): Observable<SubmissionDetail> { return this.api.get(`/submissions/${id}`); }
}
