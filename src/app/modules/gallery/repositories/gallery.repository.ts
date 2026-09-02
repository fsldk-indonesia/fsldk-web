import { Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { GalleryApiService } from '../services/gallery-api.service';
import {
  Gallery,
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
 * State and data repository for the Gallery module.
 */
@Injectable({ providedIn: 'root' })
export class GalleryRepository {
  private api = inject(GalleryApiService);

  // Signals
  publicGalleries = signal<GalleryListItem[]>([]);
  publicPage = signal<number>(1);
  publicTotal = signal<number>(0);
  publicTotalPages = signal<number>(1);

  currentGallery = signal<Gallery | null>(null);
  photoPage = signal<PhotoPage | null>(null);

  cmsGalleries = signal<Pagination<GalleryListItem> | null>(null);

  loading = signal<boolean>(false);
  photosLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  loadPublic(page = 1, limit = 9, sort = 'newest'): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listPublic(page, limit, sort).subscribe({
      next: (res) => {
        const result = res.result;
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

  loadPublicDetail(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getPublic(id).subscribe({
      next: (res) => {
        this.currentGallery.set(res.result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat detail galeri');
        this.loading.set(false);
      },
    });
  }

  loadPhotosPublic(id: number, page = 1, limit = 12, onComplete?: (result: PhotoPage) => void): void {
    this.photosLoading.set(true);
    this.api.listPhotosPublic(id, page, limit).subscribe({
      next: (res) => {
        this.photoPage.set(res.result);
        this.photosLoading.set(false);
        if (onComplete) onComplete(res.result);
      },
      error: () => {
        this.photosLoading.set(false);
      },
    });
  }

  loadCMS(params: {
    page: number;
    limit: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): void {
    this.loading.set(true);
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('limit', params.limit);

    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);

    this.api.listCMS(httpParams).subscribe({
      next: (res) => {
        this.cmsGalleries.set(res.result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Gagal memuat data galeri');
        this.loading.set(false);
      },
    });
  }

  getCMS(id: number) {
    return this.api.getCMS(id);
  }

  create(req: GalleryCreateReq) {
    return this.api.create(req);
  }

  update(id: number, req: GalleryUpdateReq) {
    return this.api.update(id, req);
  }

  delete(id: number) {
    return this.api.delete(id);
  }

  loadPhotosCMS(id: number, page = 1, limit = 50) {
    return this.api.listPhotosCMS(id, page, limit);
  }

  addPhoto(id: number, req: AddPhotoReq) {
    return this.api.addPhoto(id, req);
  }

  updatePhoto(id: number, photoID: number, req: UpdatePhotoReq) {
    return this.api.updatePhoto(id, photoID, req);
  }

  deletePhoto(id: number, photoID: number) {
    return this.api.deletePhoto(id, photoID);
  }

  reorderPhotos(id: number, req: ReorderPhotosReq) {
    return this.api.reorderPhotos(id, req);
  }
}
