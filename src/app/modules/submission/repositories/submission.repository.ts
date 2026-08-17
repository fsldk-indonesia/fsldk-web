import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SubmissionApiService } from '../services/submission-api.service';
import { SubmissionResponse, SubmissionDetail } from '../entities/submission';

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
}
