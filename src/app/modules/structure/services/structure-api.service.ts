import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Structure, StructureCreateReq, StructureUpdateReq } from '../entities/structure';

/** Raw HTTP calls for the org structure archive — public & CMS. */
@Injectable({ providedIn: 'root' })
export class StructureApiService {
  private api = inject(ApiService);

  listPublic(): Observable<Structure[]> { return this.api.get('/public/structures'); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Structure>> { return this.api.get('/structures', q); }
  cmsGet(id: number): Observable<Structure> { return this.api.get(`/structures/${id}`); }
  create(body: StructureCreateReq): Observable<{ structureID: number }> { return this.api.post('/structures', body); }
  update(id: number, body: StructureUpdateReq): Observable<unknown> { return this.api.put(`/structures/${id}`, body); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/structures/${id}`); }
  bulkDelete(ids: number[]): Observable<unknown> { return this.api.post('/structures/bulk-delete', { ids }); }
}
