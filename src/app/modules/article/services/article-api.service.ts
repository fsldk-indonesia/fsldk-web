import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Article } from '../entities/article';
import { ArticleCategory } from '../entities/article-category';

/** Panggilan HTTP mentah untuk artikel — publik & CMS. */
@Injectable({ providedIn: 'root' })
export class ArticleApiService {
  private api = inject(ApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Article>> { return this.api.get('/public/articles', q); }
  publicDetail(slug: string): Observable<Article> { return this.api.get(`/public/articles/${slug}`); }
  categories(): Observable<ArticleCategory[]> { return this.api.get('/public/article-categories'); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Article>> { return this.api.get('/articles', q); }
  cmsGet(id: number): Observable<Article> { return this.api.get(`/articles/${id}`); }
  create(body: unknown): Observable<Article> { return this.api.post('/articles', body); }
  update(id: number, body: unknown): Observable<Article> { return this.api.put(`/articles/${id}`, body); }
  publish(id: number, isPublished: boolean): Observable<unknown> { return this.api.patch(`/articles/${id}/publish`, { isPublished }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/articles/${id}`); }
}
