import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { NewsApiService } from '../services/news-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { News, NewsFilterOptions } from '../entities/news';
import { NewsCategory } from '../entities/news-category';

/**
 * State and data repository for the News module. Signals di sini murni
 * untuk halaman publik (dikonsumsi langsung lewat template, lihat
 * NewsPublicIndexPage/NewsPublicDetailPage) — pola sama seperti Galeri.
 * Sisi CMS (news.index/news.form) dan Beranda tetap memakai method yang
 * me-return Observable langsung (publicList/categories dkk, TIDAK diubah).
 */
@Injectable({ providedIn: 'root' })
export class NewsRepository {
  private api = inject(NewsApiService);

  // Public signals
  publicNews = signal<News[]>([]);
  publicPage = signal<number>(1);
  publicLimit = signal<number>(9);
  publicTotal = signal<number>(0);

  currentNews = signal<News | null>(null);

  /** Opsi dropdown filter Kategori — dimuat sekali lewat loadPublicCategories(),
   *  independen dari loading()/error() di atas (itu punya arti "sedang memuat
   *  DAFTAR berita", bukan opsi filter). Nama signal sengaja `publicCategories`
   *  (bukan `categories`) supaya tidak bentrok dengan method Observable
   *  `categories()` di bawah yang masih dipakai CMS. */
  publicCategories = signal<NewsCategory[]>([]);
  categoriesLoading = signal<boolean>(false);

  /** Opsi dropdown filter "Tahun Terbit"/"Penulis" — dimuat sekali lewat
   *  loadFilterOptions(), pola sama seperti publicCategories di atas (dan
   *  GalleryRepository.filterOptions). */
  filterOptions = signal<NewsFilterOptions | null>(null);
  filterOptionsLoading = signal<boolean>(false);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  loadPublic(
    page = 1,
    limit = 9,
    sort = '-publishedDate',
    params: { search?: string; category?: string; year?: number[]; reporter?: string[]; featured?: boolean } = {},
  ): void {
    this.loading.set(true);
    this.error.set(null);
    this.publicLimit.set(limit);
    const query: Record<string, unknown> = { page, limit, sort };
    if (params.search) query['search'] = params.search;
    if (params.category) query['category'] = params.category;
    if (params.year?.length) query['year'] = params.year.join(',');
    if (params.reporter?.length) query['reporter'] = params.reporter.join(',');
    if (params.featured !== undefined) query['featured'] = params.featured;
    this.api.publicList(query).subscribe({
      next: (result) => {
        this.publicNews.set(result.data);
        this.publicPage.set(result.page);
        this.publicTotal.set(result.count);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat berita');
        this.loading.set(false);
      },
    });
  }

  loadPublicCategories(): void {
    if (this.publicCategories().length || this.categoriesLoading()) return;
    this.categoriesLoading.set(true);
    this.api.categories().subscribe({
      next: (cats) => { this.publicCategories.set(cats); this.categoriesLoading.set(false); },
      error: () => this.categoriesLoading.set(false),
    });
  }

  loadFilterOptions(): void {
    if (this.filterOptions() || this.filterOptionsLoading()) return;
    this.filterOptionsLoading.set(true);
    this.api.getPublicFilterOptions().subscribe({
      next: (opts) => { this.filterOptions.set(opts); this.filterOptionsLoading.set(false); },
      error: () => this.filterOptionsLoading.set(false),
    });
  }

  loadPublicDetail(slug: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.publicDetail(slug).subscribe({
      next: (result) => {
        this.currentNews.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat detail berita');
        this.currentNews.set(null);
        this.loading.set(false);
      },
    });
  }

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
  bulkDelete(ids: number[]): Observable<unknown> { return this.api.bulkDelete(ids); }
}
