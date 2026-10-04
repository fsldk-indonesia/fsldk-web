import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
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

/** Query params opsional untuk listPublic — search (judul/tema kegiatan),
 *  eventName & year (filter modal "Tahun Kegiatan"/"Nama Kegiatan"), keduanya
 *  multi-select (array) — ApiService.toParams() mengirimnya sebagai query key
 *  berulang (?eventName=A&eventName=B), diterima backend via Gin QueryArray.
 *  Semua opsional supaya call site lama (tanpa filter) tetap kompatibel. */
export interface GalleryPublicListParams {
  search?: string;
  eventName?: string[];
  year?: number[];
}

/** Raw HTTP calls for the gallery module — public & CMS. */
@Injectable({ providedIn: 'root' })
export class GalleryApiService {
  private api = inject(ApiService);

  // Public Endpoints
  listPublic(page = 1, limit = 9, sort = 'newest', params: GalleryPublicListParams = {}): Observable<{ data: GalleryListItem[]; page: number; limit: number; total: number; totalPages: number }> {
    const query: Record<string, unknown> = { page, limit, sort };
    if (params.search) query['search'] = params.search;
    if (params.eventName?.length) query['eventName'] = params.eventName;
    if (params.year?.length) query['year'] = params.year;
    return this.api.get('/public/galleries', query);
  }

  /** Nilai distinct tahun & nama kegiatan yang ada di data — mengisi dropdown
   *  filter publik (lihat GalleryFilterOptions). */
  getPublicFilterOptions(): Observable<GalleryFilterOptions> {
    return this.api.get('/public/galleries/filter-options');
  }

  getPublic(id: number): Observable<Gallery> {
    return this.api.get(`/public/galleries/${id}`);
  }

  listPhotosPublic(id: number, page = 1, limit = 12): Observable<PhotoPage> {
    return this.api.get(`/public/galleries/${id}/photos`, { page, limit });
  }

  // CMS Endpoints
  cmsList(q: Record<string, unknown>): Observable<Pagination<GalleryListItem>> {
    return this.api.get('/galleries', q);
  }

  getCMS(id: number): Observable<Gallery> {
    return this.api.get(`/galleries/${id}`);
  }

  create(req: GalleryCreateReq): Observable<{ galleryID: number }> {
    return this.api.post('/galleries', req);
  }

  update(id: number, req: GalleryUpdateReq): Observable<null> {
    return this.api.put(`/galleries/${id}`, req);
  }

  remove(id: number): Observable<null> {
    return this.api.delete(`/galleries/${id}`);
  }

  bulkDelete(ids: number[]): Observable<null> {
    return this.api.post('/galleries/bulk-delete', { ids });
  }

  // Photo Sub-Endpoints (CMS)
  listPhotosCMS(id: number, page = 1, limit = 50): Observable<PhotoPage> {
    return this.api.get(`/galleries/${id}/photos`, { page, limit });
  }

  addPhoto(id: number, req: AddPhotoReq): Observable<GalleryPhoto> {
    return this.api.post(`/galleries/${id}/photos`, req);
  }

  updatePhoto(id: number, photoID: number, req: UpdatePhotoReq): Observable<null> {
    return this.api.put(`/galleries/${id}/photos/${photoID}`, req);
  }

  deletePhoto(id: number, photoID: number): Observable<null> {
    return this.api.delete(`/galleries/${id}/photos/${photoID}`);
  }

  reorderPhotos(id: number, req: ReorderPhotosReq): Observable<null> {
    return this.api.post(`/galleries/${id}/photos/reorder`, req);
  }
}
