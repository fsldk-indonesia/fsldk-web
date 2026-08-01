import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ArticleApiService } from '../services/article-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Article } from '../entities/article';
import { ArticleCategory } from '../entities/article-category';

@Injectable({ providedIn: 'root' })
export class ArticleRepository {
  private api = inject(ArticleApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Article>> { return this.api.publicList(q); }
  publicDetail(slug: string): Observable<Article> { return this.api.publicDetail(slug); }
  categories(): Observable<ArticleCategory[]> { return this.api.categories(); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Article>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<Article> { return this.api.cmsGet(id); }
  create(body: unknown): Observable<Article> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<Article> { return this.api.update(id, body); }
  publish(id: number, isPublished: boolean): Observable<unknown> { return this.api.publish(id, isPublished); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
}
