import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StructureApiService } from '../services/structure-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Structure, StructureCreateReq, StructureUpdateReq } from '../entities/structure';

@Injectable({ providedIn: 'root' })
export class StructureRepository {
  private api = inject(StructureApiService);

  listPublic(): Observable<Structure[]> { return this.api.listPublic(); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Structure>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<Structure> { return this.api.cmsGet(id); }
  create(body: StructureCreateReq): Observable<{ structureID: number }> { return this.api.create(body); }
  update(id: number, body: StructureUpdateReq): Observable<unknown> { return this.api.update(id, body); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
  bulkDelete(ids: number[]): Observable<unknown> { return this.api.bulkDelete(ids); }
}
