import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GoodsCategoryApiService } from '../services/goods-category-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { GoodsCategory } from '../entities/goods-category';

@Injectable({ providedIn: 'root' })
export class GoodsCategoryRepository {
  private api = inject(GoodsCategoryApiService);

  cmsList(q: Record<string, unknown> = {}): Observable<Pagination<GoodsCategory>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<GoodsCategory> { return this.api.cmsGet(id); }
  create(body: unknown): Observable<GoodsCategory> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<GoodsCategory> { return this.api.update(id, body); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
  bulkDelete(ids: number[]): Observable<unknown> { return this.api.bulkDelete(ids); }
}
