import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SubmissionApiService } from '../services/submission-api.service';
import { Pagination } from '../../../core/entities/pagination';
import {
  SubmissionResponse, SubmissionDetail, ReviewRequest, EstablishLevelRequest, VersionedRequest, ReopenRequest,
} from '../entities/submission';

@Injectable({ providedIn: 'root' })
export class SubmissionRepository {
  private api = inject(SubmissionApiService);

  create(formCode: string, organizationID?: number | null): Observable<SubmissionResponse> {
    return this.api.create({ formCode, organizationID });
  }
  saveAnswers(id: number, body: unknown): Observable<SubmissionDetail> { return this.api.saveAnswers(id, body); }
  submit(id: number): Observable<SubmissionResponse> { return this.api.submit(id); }
  cancel(id: number): Observable<unknown> { return this.api.cancel(id); }
  findMine(formCode: string): Observable<SubmissionResponse | null> {
    return this.api.list(formCode).pipe(map((page) => page.data[0] ?? null));
  }
  get(id: number): Observable<SubmissionDetail> { return this.api.get(id); }

  /** Antrean submission untuk satu status (dipanggil beberapa kali & digabung untuk beberapa status sekaligus). */
  listByStatus(formCode: string, status: string, organizationID?: number, page = 1, limit = 50): Observable<Pagination<SubmissionResponse>> {
    return this.api.listQueue({ formCode, status, page, limit, organizationID });
  }

  /** Seluruh submission satu form dalam cakupan akses caller, tanpa filter status — dipakai halaman laporan. */
  listAll(formCode: string, organizationID?: number, page = 1, limit = 200): Observable<Pagination<SubmissionResponse>> {
    return this.api.listQueue({ formCode, page, limit, organizationID });
  }

  review(id: number, body: ReviewRequest): Observable<SubmissionResponse> { return this.api.review(id, body); }
  establishLevel(id: number, body: EstablishLevelRequest): Observable<SubmissionResponse> { return this.api.establishLevel(id, body); }
  publish(id: number, body: VersionedRequest): Observable<SubmissionResponse> { return this.api.publish(id, body); }
  reopen(id: number, body: ReopenRequest): Observable<SubmissionResponse> { return this.api.reopen(id, body); }
  reassess(id: number, body: VersionedRequest): Observable<SubmissionResponse> { return this.api.reassess(id, body); }
}
