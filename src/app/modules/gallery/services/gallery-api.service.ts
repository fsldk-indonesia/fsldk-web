import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
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

/** Raw HTTP calls for the gallery module — public & CMS. */
@Injectable({ providedIn: 'root' })
export class GalleryApiService {
  private api = inject(ApiService);

  // Public Endpoints
  listPublic(page = 1, limit = 9, sort = 'newest'): Observable<{ data: GalleryListItem[]; page: number; limit: number; total: number; totalPages: number }> {
    return this.api.get('/public/galleries', { page, limit, sort });
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
