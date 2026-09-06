import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { GoodsCategory } from '../entities/goods-category';

/** Panggilan HTTP mentah untuk kategori goods — CRUD CMS. */
@Injectable({ providedIn: 'root' })
export class GoodsCategoryApiService {
  private api = inject(ApiService);

  cmsList(): Observable<GoodsCategory[]> { return this.api.get('/goods-categories'); }
  create(body: unknown): Observable<GoodsCategory> { return this.api.post('/goods-categories', body); }
  update(id: number, body: unknown): Observable<GoodsCategory> { return this.api.put(`/goods-categories/${id}`, body); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/goods-categories/${id}`); }
}
