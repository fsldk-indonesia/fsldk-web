import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SubmissionApiService } from '../services/submission-api.service';
import { Pagination } from '../../../core/entities/pagination';
import {
  SubmissionResponse, SubmissionDetail, ReviewRequest, EstablishLevelRequest, VersionedRequest, ReopenRequest,
  SaveFieldScoresRequest,
} from '../entities/submission';

@Injectable({ providedIn: 'root' })
export class SubmissionRepository {
  private api = inject(SubmissionApiService);

  /** `organizationID` = LDK Tujuan (Kader). `targetOrganizationID` = LDK yang
   *  sedang dibuka lewat org-switcher (delegasi Puskomda/Puskomnas mengisi
   *  Pendataan atas nama LDK) — lihat catatan di submission-api.service.ts. */
  create(formCode: string, organizationID?: number | null, targetOrganizationID?: number): Observable<SubmissionResponse> {
    return this.api.create({ formCode, organizationID }, targetOrganizationID);
  }
  saveAnswers(id: number, body: unknown): Observable<SubmissionDetail> { return this.api.saveAnswers(id, body); }
  submit(id: number): Observable<SubmissionResponse> { return this.api.submit(id); }
  cancel(id: number): Observable<unknown> { return this.api.cancel(id); }
  findMine(formCode: string, organizationID?: number): Observable<SubmissionResponse | null> {
    return this.api.list(formCode, organizationID).pipe(map((page) => page.data[0] ?? null));
  }
  get(id: number): Observable<SubmissionDetail> { return this.api.get(id); }

  /** Antrean submission untuk satu status (dipanggil beberapa kali & digabung untuk beberapa status sekaligus). */
  listByStatus(formCode: string, status: string, organizationID?: number, page = 1, limit = 50): Observable<Pagination<SubmissionResponse>> {
    return this.api.listQueue({ formCode, status, page, limit, organizationID });
  }

  /** Seluruh submission satu form dalam cakupan akses caller, terpaginasi
   *  penuh dengan sort/status multi/search nama LDK — dipakai `<app-cms-index>`
   *  di halaman Laporan (Menu Laporan Puskomda & Laporan Nasional Puskomnas,
   *  satu komponen yang sama). `status` kosong = tanpa filter (semua status). */
  listAll(
    formCode: string,
    params: { page: number; limit: number; sort: string; status: string[]; search: string },
    organizationID?: number,
  ): Observable<Pagination<SubmissionResponse>> {
    return this.api.listQueue({
      formCode, page: params.page, limit: params.limit, sort: params.sort,
      status: params.status.join(','), search: params.search, organizationID,
    });
  }

  review(id: number, body: ReviewRequest): Observable<SubmissionResponse> { return this.api.review(id, body); }
  establishLevel(id: number, body: EstablishLevelRequest): Observable<SubmissionResponse> { return this.api.establishLevel(id, body); }
  publish(id: number, body: VersionedRequest): Observable<SubmissionResponse> { return this.api.publish(id, body); }
  reopen(id: number, body: ReopenRequest): Observable<SubmissionResponse> { return this.api.reopen(id, body); }
  reassess(id: number, body: VersionedRequest): Observable<SubmissionResponse> { return this.api.reassess(id, body); }
  reassessKader(id: number, body: VersionedRequest): Observable<SubmissionResponse> { return this.api.reassessKader(id, body); }
  saveFieldScores(id: number, body: SaveFieldScoresRequest): Observable<SubmissionDetail> { return this.api.saveFieldScores(id, body); }
}
