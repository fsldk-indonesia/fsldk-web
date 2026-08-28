import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogBookApiService } from '../services/catalogbook-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { CatalogBook } from '../entities/catalog-book';
import { BookCategory } from '../entities/book-category';
import { BookLanguage } from '../entities/book-language';
import { BookAuthorType } from '../entities/book-author-type';
import { BookAvailabilityType } from '../entities/book-availability-type';

@Injectable({ providedIn: 'root' })
export class CatalogBookRepository {
  private api = inject(CatalogBookApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<CatalogBook>> { return this.api.publicList(q); }
  publicDetail(slug: string): Observable<CatalogBook> { return this.api.publicDetail(slug); }
  like(id: number): Observable<{ favoriteCount: number }> { return this.api.like(id); }
  categories(): Observable<BookCategory[]> { return this.api.categories(); }
  languages(): Observable<BookLanguage[]> { return this.api.languages(); }
  authorTypes(): Observable<BookAuthorType[]> { return this.api.authorTypes(); }
  availabilityTypes(): Observable<BookAvailabilityType[]> { return this.api.availabilityTypes(); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<CatalogBook>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<CatalogBook> { return this.api.cmsGet(id); }
  create(body: unknown): Observable<CatalogBook> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<CatalogBook> { return this.api.update(id, body); }
  publish(id: number, isActive: boolean): Observable<unknown> { return this.api.publish(id, isActive); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
}
