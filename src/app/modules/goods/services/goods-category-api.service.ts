import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { GoodsCategory } from '../entities/goods-category';

/** Panggilan HTTP mentah untuk kategori goods — CRUD CMS. */
@Injectable({ providedIn: 'root' })
export class GoodsCategoryApiService {
  private api = inject(ApiService);

  cmsList(q: Record<string, unknown> = {}): Observable<Pagination<GoodsCategory>> { return this.api.get('/goods-categories', q); }
  cmsGet(id: number): Observable<GoodsCategory> { return this.api.get(`/goods-categories/${id}`); }
  create(body: unknown): Observable<GoodsCategory> { return this.api.post('/goods-categories', body); }
  update(id: number, body: unknown): Observable<GoodsCategory> { return this.api.put(`/goods-categories/${id}`, body); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/goods-categories/${id}`); }
  bulkDelete(ids: number[]): Observable<unknown> { return this.api.post('/goods-categories/bulk-delete', { ids }); }
}
