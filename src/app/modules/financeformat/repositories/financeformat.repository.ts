import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinanceFormatApiService } from '../services/financeformat-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { FinanceFormat } from '../entities/finance-format';
import { FinanceFormatType } from '../entities/finance-format-type';
import { FinanceFormatPublicList } from '../entities/finance-format-public';

/** The financeformat module's public data API — the rest of the app injects this. */
@Injectable({ providedIn: 'root' })
export class FinanceFormatRepository {
  private api = inject(FinanceFormatApiService);

  publicList(): Observable<FinanceFormatPublicList> { return this.api.publicList(); }

  formatTypes(): Observable<FinanceFormatType[]> { return this.api.formatTypes(); }
  cmsList(q: Record<string, unknown>): Observable<Pagination<FinanceFormat>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<FinanceFormat> { return this.api.cmsGet(id); }
  create(body: unknown): Observable<FinanceFormat> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<FinanceFormat> { return this.api.update(id, body); }
  publish(id: number, isActive: boolean): Observable<unknown> { return this.api.publish(id, isActive); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
}
