import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NewsApiService } from '../services/news-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { News } from '../entities/news';
import { NewsCategory } from '../entities/news-category';

@Injectable({ providedIn: 'root' })
export class NewsRepository {
  private api = inject(NewsApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<News>> { return this.api.publicList(q); }
  publicDetail(slug: string): Observable<News> { return this.api.publicDetail(slug); }
  featured(limit = 3): Observable<News[]> { return this.api.featured(limit); }
  categories(): Observable<NewsCategory[]> { return this.api.categories(); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<News>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<News> { return this.api.cmsGet(id); }
  create(body: unknown): Observable<News> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<News> { return this.api.update(id, body); }
  publish(id: number, isPublished: boolean): Observable<unknown> { return this.api.publish(id, isPublished); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
}
