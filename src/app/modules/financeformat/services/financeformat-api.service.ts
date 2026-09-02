import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { FinanceFormat } from '../entities/finance-format';
import { FinanceFormatType } from '../entities/finance-format-type';
import { FinanceFormatPublicList } from '../entities/finance-format-public';

/** Raw HTTP calls for finance formats — public & CMS. */
@Injectable({ providedIn: 'root' })
export class FinanceFormatApiService {
  private api = inject(ApiService);

  publicList(): Observable<FinanceFormatPublicList> { return this.api.get('/public/finance-formats'); }

  formatTypes(): Observable<FinanceFormatType[]> { return this.api.get('/finance-formats/types'); }
  cmsList(q: Record<string, unknown>): Observable<Pagination<FinanceFormat>> { return this.api.get('/finance-formats', q); }
  cmsGet(id: number): Observable<FinanceFormat> { return this.api.get(`/finance-formats/${id}`); }
  create(body: unknown): Observable<FinanceFormat> { return this.api.post('/finance-formats', body); }
  update(id: number, body: unknown): Observable<FinanceFormat> { return this.api.put(`/finance-formats/${id}`, body); }
  publish(id: number, isActive: boolean): Observable<unknown> { return this.api.patch(`/finance-formats/${id}/publish`, { isActive }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/finance-formats/${id}`); }
}
