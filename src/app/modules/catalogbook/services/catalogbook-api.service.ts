import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { CatalogBook } from '../entities/catalog-book';
import { BookCategory } from '../entities/book-category';
import { BookLanguage } from '../entities/book-language';
import { BookAuthorType } from '../entities/book-author-type';
import { BookAvailabilityType } from '../entities/book-availability-type';

/** Raw HTTP calls for the book catalog — public & CMS. */
@Injectable({ providedIn: 'root' })
export class CatalogBookApiService {
  private api = inject(ApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<CatalogBook>> { return this.api.get('/public/catalog-books', q); }
  publicDetail(slug: string): Observable<CatalogBook> { return this.api.get(`/public/catalog-books/${slug}`); }
  like(id: number): Observable<{ favoriteCount: number }> { return this.api.post(`/public/catalog-books/${id}/like`); }
  categories(): Observable<BookCategory[]> { return this.api.get('/public/catalog-book-categories'); }
  languages(): Observable<BookLanguage[]> { return this.api.get('/public/catalog-book-languages'); }
  authorTypes(): Observable<BookAuthorType[]> { return this.api.get('/public/catalog-book-author-types'); }
  availabilityTypes(): Observable<BookAvailabilityType[]> { return this.api.get('/public/catalog-book-availability-types'); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<CatalogBook>> { return this.api.get('/catalog-books', q); }
  cmsGet(id: number): Observable<CatalogBook> { return this.api.get(`/catalog-books/${id}`); }
  create(body: unknown): Observable<CatalogBook> { return this.api.post('/catalog-books', body); }
  update(id: number, body: unknown): Observable<CatalogBook> { return this.api.put(`/catalog-books/${id}`, body); }
  publish(id: number, isActive: boolean): Observable<unknown> { return this.api.patch(`/catalog-books/${id}/publish`, { isActive }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/catalog-books/${id}`); }
}
