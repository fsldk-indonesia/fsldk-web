import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ArticleApiService, ArticleFilterOptions, ArticlePublicListParams } from '../services/article-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Article } from '../entities/article';
import { ArticleCategory } from '../entities/article-category';

/**
 * State and data repository for the Article module. Signals di sini murni
 * untuk halaman publik (dikonsumsi langsung lewat template, lihat
 * ArticlePublicIndexPage/ArticlePublicDetailPage) — sisi CMS & konsumer lain
 * (mis. HomeIndexPresenter) memakai method yang me-return Observable
 * langsung, pola sama seperti GalleryRepository.
 */
@Injectable({ providedIn: 'root' })
export class ArticleRepository {
  private api = inject(ArticleApiService);

  // Public signals
  publicArticles = signal<Article[]>([]);
  publicPage = signal<number>(1);
  publicTotal = signal<number>(0);
  publicTotalPages = signal<number>(1);
  currentArticle = signal<Article | null>(null);

  /** Opsi dropdown filter publik (Tahun Publikasi) — dimuat sekali lewat
   *  loadFilterOptions(), independen dari loading()/error() di bawah. */
  filterOptions = signal<ArticleFilterOptions | null>(null);
  filterOptionsLoading = signal<boolean>(false);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  loadPublic(page = 1, limit = 9, sort = '-publishedDate', params: ArticlePublicListParams = {}): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listPublic(page, limit, sort, params).subscribe({
      next: (result) => {
        this.publicArticles.set(result.data);
        this.publicPage.set(result.page);
        this.publicTotal.set(result.count);
        this.publicTotalPages.set(Math.max(1, Math.ceil(result.count / result.limit)));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat artikel');
        this.loading.set(false);
      },
    });
  }

  loadFilterOptions(): void {
    if (this.filterOptions() || this.filterOptionsLoading()) return;
    this.filterOptionsLoading.set(true);
    this.api.getPublicFilterOptions().subscribe({
      next: (opts) => {
        this.filterOptions.set(opts);
        this.filterOptionsLoading.set(false);
      },
      error: () => this.filterOptionsLoading.set(false),
    });
  }

  loadPublicDetail(slug: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.publicDetail(slug).subscribe({
      next: (article) => {
        this.currentArticle.set(article);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat detail artikel');
        this.currentArticle.set(null);
        this.loading.set(false);
      },
    });
  }

  publicList(q: Record<string, unknown>): Observable<Pagination<Article>> { return this.api.publicList(q); }
  publicDetail(slug: string): Observable<Article> { return this.api.publicDetail(slug); }
  categories(): Observable<ArticleCategory[]> { return this.api.categories(); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Article>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<Article> { return this.api.cmsGet(id); }
  create(body: unknown): Observable<Article> { return this.api.create(body); }
  update(id: number, body: unknown): Observable<Article> { return this.api.update(id, body); }
  publish(id: number, isPublished: boolean): Observable<unknown> { return this.api.publish(id, isPublished); }
  remove(id: number): Observable<unknown> { return this.api.remove(id); }
  bulkDelete(ids: number[]): Observable<unknown> { return this.api.bulkDelete(ids); }
}
