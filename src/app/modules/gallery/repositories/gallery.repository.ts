import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { GalleryApiService, GalleryPublicListParams } from '../services/gallery-api.service';
import {
  Gallery,
  GalleryFilterOptions,
  GalleryListItem,
  GalleryPhoto,
  PhotoPage,
  GalleryCreateReq,
  GalleryUpdateReq,
  AddPhotoReq,
  UpdatePhotoReq,
  ReorderPhotosReq,
} from '../entities/gallery';
import { Pagination } from '../../../core/entities/pagination';

/**
 * State and data repository for the Gallery module. Signals di sini murni
 * untuk halaman publik (dikonsumsi langsung lewat template, lihat
 * GalleryPublicIndexPage/GalleryPublicDetailPage) — sisi CMS memakai
 * method yang me-return Observable langsung, dikonsumsi lewat presenter
 * (GalleryIndexPresenter/GalleryFormPresenter), pola sama seperti Berita.
 */
@Injectable({ providedIn: 'root' })
export class GalleryRepository {
  private api = inject(GalleryApiService);

  // Public signals
  publicGalleries = signal<GalleryListItem[]>([]);
  publicPage = signal<number>(1);
  publicTotal = signal<number>(0);
  publicTotalPages = signal<number>(1);

  currentGallery = signal<Gallery | null>(null);
  photoPage = signal<PhotoPage | null>(null);

  /** Opsi dropdown filter publik (Tahun Kegiatan/Nama Kegiatan) — dimuat
   *  sekali lewat loadFilterOptions(), independen dari loading()/error() di
   *  atas (itu punya arti "sedang memuat DAFTAR galeri", bukan opsi filter). */
  filterOptions = signal<GalleryFilterOptions | null>(null);
  filterOptionsLoading = signal<boolean>(false);

  loading = signal<boolean>(false);
  photosLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  loadPublic(page = 1, limit = 9, sort = 'newest', params: GalleryPublicListParams = {}): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listPublic(page, limit, sort, params).subscribe({
      next: (result) => {
        this.publicGalleries.set(result.data);
        this.publicPage.set(result.page);
        this.publicTotal.set(result.total);
        this.publicTotalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat galeri');
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
    this.api.getPublic(slug).subscribe({
      next: (result) => {
        this.currentGallery.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat detail galeri');
        this.loading.set(false);
      },
    });
  }

  loadPhotosPublic(slug: string, page = 1, limit = 12, onComplete?: (result: PhotoPage) => void): void {
    this.photosLoading.set(true);
    this.api.listPhotosPublic(slug, page, limit).subscribe({
      next: (result) => {
        this.photoPage.set(result);
        this.photosLoading.set(false);
        if (onComplete) onComplete(result);
      },
      error: () => {
        this.photosLoading.set(false);
      },
    });
  }

  // CMS
  cmsList(q: Record<string, unknown>): Observable<Pagination<GalleryListItem>> { return this.api.cmsList(q); }
  cmsGet(id: number): Observable<Gallery> { return this.api.getCMS(id); }
  create(req: GalleryCreateReq): Observable<{ galleryID: number }> { return this.api.create(req); }
  update(id: number, req: GalleryUpdateReq): Observable<null> { return this.api.update(id, req); }
  remove(id: number): Observable<null> { return this.api.remove(id); }
  bulkDelete(ids: number[]): Observable<null> { return this.api.bulkDelete(ids); }

  // CMS photo management
  loadPhotosCMS(id: number, page = 1, limit = 50): Observable<PhotoPage> { return this.api.listPhotosCMS(id, page, limit); }
  addPhoto(id: number, req: AddPhotoReq): Observable<GalleryPhoto> { return this.api.addPhoto(id, req); }
  updatePhoto(id: number, photoID: number, req: UpdatePhotoReq): Observable<null> { return this.api.updatePhoto(id, photoID, req); }
  deletePhoto(id: number, photoID: number): Observable<null> { return this.api.deletePhoto(id, photoID); }
  reorderPhotos(id: number, req: ReorderPhotosReq): Observable<null> { return this.api.reorderPhotos(id, req); }
}
