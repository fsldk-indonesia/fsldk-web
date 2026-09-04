import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GoodsApiService } from '../services/goods-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Goods, GoodsDetail } from '../entities/goods';
import { GoodsCategory } from '../entities/goods-category';

@Injectable({ providedIn: 'root' })
export class GoodsRepository {
  private api = inject(GoodsApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Goods>> { return this.api.publicList(q); }
  publicDetail(slug: string): Observable<GoodsDetail> { return this.api.publicDetail(slug); }
  publicCategories(): Observable<GoodsCategory[]> { return this.api.publicCategories(); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Goods>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<GoodsDetail> { return this.api.cmsGet(id); }
  create(body: unknown): Observable<GoodsDetail> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<GoodsDetail> { return this.api.update(id, body); }
  publish(id: number, isPublished: boolean): Observable<unknown> { return this.api.publish(id, isPublished); }
  featuredToggle(id: number, isFeatured: boolean): Observable<unknown> { return this.api.featuredToggle(id, isFeatured); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
}
