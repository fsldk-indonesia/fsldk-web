import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { News } from '../entities/news';
import { NewsCategory } from '../entities/news-category';

/** Panggilan HTTP mentah untuk berita — publik & CMS. */
@Injectable({ providedIn: 'root' })
export class NewsApiService {
  private api = inject(ApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<News>> { return this.api.get('/public/news', q); }
  publicDetail(slug: string): Observable<News> { return this.api.get(`/public/news/${slug}`); }
  featured(limit = 3): Observable<News[]> { return this.api.get('/public/news-featured', { limit }); }
  categories(): Observable<NewsCategory[]> { return this.api.get('/public/news-categories'); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<News>> { return this.api.get('/news', q); }
  cmsGet(id: number): Observable<News> { return this.api.get(`/news/${id}`); }
  create(body: unknown): Observable<News> { return this.api.post('/news', body); }
  update(id: number, body: unknown): Observable<News> { return this.api.put(`/news/${id}`, body); }
  publish(id: number, isPublished: boolean): Observable<unknown> { return this.api.patch(`/news/${id}/publish`, { isPublished }); }
  featuredToggle(id: number, isFeatured: boolean): Observable<unknown> { return this.api.patch(`/news/${id}/featured`, { isFeatured }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/news/${id}`); }
}
