import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { JobQueueApiService } from '../services/jobqueue-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Job, JobStats } from '../entities/job';

@Injectable({ providedIn: 'root' })
export class JobQueueRepository {
  private api = inject(JobQueueApiService);

  list(q: Record<string, unknown>): Observable<Pagination<Job>> { return this.api.list(q); }
  get(id: number): Observable<Job> { return this.api.get(id); }
  stats(): Observable<JobStats> { return this.api.stats(); }
  retry(id: number): Observable<unknown> { return this.api.retry(id); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
}
