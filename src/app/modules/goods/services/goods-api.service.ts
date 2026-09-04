import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Goods, GoodsDetail } from '../entities/goods';
import { GoodsCategory } from '../entities/goods-category';

/** Panggilan HTTP mentah untuk produk goods — publik & CMS. */
@Injectable({ providedIn: 'root' })
export class GoodsApiService {
  private api = inject(ApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Goods>> { return this.api.get('/public/goods', q); }
  publicDetail(slug: string): Observable<GoodsDetail> { return this.api.get(`/public/goods/${slug}`); }
  publicCategories(): Observable<GoodsCategory[]> { return this.api.get('/public/goods-categories'); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Goods>> { return this.api.get('/goods', q); }
  cmsGet(id: number): Observable<GoodsDetail> { return this.api.get(`/goods/${id}`); }
  create(body: unknown): Observable<GoodsDetail> { return this.api.post('/goods', body); }
  update(id: number, body: unknown): Observable<GoodsDetail> { return this.api.put(`/goods/${id}`, body); }
  publish(id: number, isPublished: boolean): Observable<unknown> { return this.api.patch(`/goods/${id}/publish`, { isPublished }); }
  featuredToggle(id: number, isFeatured: boolean): Observable<unknown> { return this.api.patch(`/goods/${id}/featured`, { isFeatured }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/goods/${id}`); }
}
