import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Article } from '../entities/article';
import { ArticleCategory } from '../entities/article-category';

/** Query params opsional untuk listPublic — search (judul/penulis), category
 *  (slug kategori, multi-select) & year (tahun publikasi, multi-select),
 *  keduanya array — ApiService.toParams() mengirimnya sebagai query key
 *  berulang (?category=a&category=b), diterima backend via Gin QueryArray
 *  (pola sama seperti GalleryPublicListParams). */
export interface ArticlePublicListParams {
  search?: string;
  category?: string[];
  year?: number[];
}

/** Nilai distinct tahun publikasi yang ada di data — mengisi dropdown filter
 *  publik "Tahun Publikasi" (kategori sudah punya endpoint categories() di
 *  bawah, tidak diulang di sini). */
export interface ArticleFilterOptions {
  years: number[];
}

/** Panggilan HTTP mentah untuk artikel — publik & CMS. */
@Injectable({ providedIn: 'root' })
export class ArticleApiService {
  private api = inject(ApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Article>> { return this.api.get('/public/articles', q); }

  /** Varian terstruktur publicList() di atas — dipakai halaman listing publik
   *  yang punya filter kategori/tahun multi-select & sort. publicList(q) di
   *  atas TETAP ada, tidak dihapus — masih dipakai HomeIndexPresenter (cuma
   *  butuh page/limit). BEDA dari GalleryApiService.listPublic(): endpoint
   *  artikel dibangun lewat httphelper.BuildPagination (amplop generik
   *  {page,limit,count,data,prev,next} — lihat Pagination<T>), BUKAN gin.H
   *  custom {total,totalPages} seperti Galeri — jangan disamakan shape-nya. */
  listPublic(page = 1, limit = 9, sort = '-publishedDate', params: ArticlePublicListParams = {}): Observable<Pagination<Article>> {
    const query: Record<string, unknown> = { page, limit, sort };
    if (params.search) query['search'] = params.search;
    if (params.category?.length) query['category'] = params.category;
    if (params.year?.length) query['year'] = params.year;
    return this.api.get('/public/articles', query);
  }

  getPublicFilterOptions(): Observable<ArticleFilterOptions> { return this.api.get('/public/articles/filter-options'); }

  publicDetail(slug: string): Observable<Article> { return this.api.get(`/public/articles/${slug}`); }
  categories(): Observable<ArticleCategory[]> { return this.api.get('/public/article-categories'); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Article>> { return this.api.get('/articles', q); }
  cmsGet(id: number): Observable<Article> { return this.api.get(`/articles/${id}`); }
  create(body: unknown): Observable<Article> { return this.api.post('/articles', body); }
  update(id: number, body: unknown): Observable<Article> { return this.api.put(`/articles/${id}`, body); }
  publish(id: number, isPublished: boolean): Observable<unknown> { return this.api.patch(`/articles/${id}/publish`, { isPublished }); }
  remove(id: number): Observable<unknown> { return this.api.delete(`/articles/${id}`); }
  bulkDelete(ids: number[]): Observable<unknown> { return this.api.post('/articles/bulk-delete', { ids }); }
}
