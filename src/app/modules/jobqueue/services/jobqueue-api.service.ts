import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Job, JobStats } from '../entities/job';

/** Panggilan HTTP mentah untuk dashboard job queue (/job-queue). */
@Injectable({ providedIn: 'root' })
export class JobQueueApiService {
  private api = inject(ApiService);

  list(q: Record<string, unknown>): Observable<Pagination<Job>> { return this.api.get('/job-queue', q); }
  get(id: number): Observable<Job> { return this.api.get(`/job-queue/${id}`); }
  stats(): Observable<JobStats> { return this.api.get('/job-queue/stats'); }
  retry(id: number): Observable<unknown> { return this.api.post(`/job-queue/${id}/retry`); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/job-queue/${id}`); }
}
