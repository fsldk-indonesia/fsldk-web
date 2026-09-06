import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/entities/api-response';
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

/**
 * HTTP client service for interacting with gallery backend endpoints.
 */
@Injectable({ providedIn: 'root' })
export class GalleryApiService {
  private http = inject(HttpClient);
  private apiBase = environment.apiBaseUrl;

  // Public Endpoints
  listPublic(page = 1, limit = 9, sort = 'newest'): Observable<ApiResponse<{ data: GalleryListItem[]; page: number; limit: number; total: number; totalPages: number }>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('sort', sort);
    return this.http.get<ApiResponse<{ data: GalleryListItem[]; page: number; limit: number; total: number; totalPages: number }>>(
      `${this.apiBase}/public/galleries`,
      { params }
    );
  }

  getPublic(id: number): Observable<ApiResponse<Gallery>> {
    return this.http.get<ApiResponse<Gallery>>(`${this.apiBase}/public/galleries/${id}`);
  }

  listPhotosPublic(id: number, page = 1, limit = 12): Observable<ApiResponse<PhotoPage>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<PhotoPage>>(`${this.apiBase}/public/galleries/${id}/photos`, { params });
  }

  // CMS Endpoints
  listCMS(params: HttpParams): Observable<ApiResponse<Pagination<GalleryListItem>>> {
    return this.http.get<ApiResponse<Pagination<GalleryListItem>>>(`${this.apiBase}/galleries`, { params });
  }

  getCMS(id: number): Observable<ApiResponse<Gallery>> {
    return this.http.get<ApiResponse<Gallery>>(`${this.apiBase}/galleries/${id}`);
  }

  create(req: GalleryCreateReq): Observable<ApiResponse<{ galleryID: number }>> {
    return this.http.post<ApiResponse<{ galleryID: number }>>(`${this.apiBase}/galleries`, req);
  }

  update(id: number, req: GalleryUpdateReq): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiBase}/galleries/${id}`, req);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiBase}/galleries/${id}`);
  }

  // Photo Sub-Endpoints (CMS)
  listPhotosCMS(id: number, page = 1, limit = 50): Observable<ApiResponse<PhotoPage>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<PhotoPage>>(`${this.apiBase}/galleries/${id}/photos`, { params });
  }

  addPhoto(id: number, req: AddPhotoReq): Observable<ApiResponse<GalleryPhoto>> {
    return this.http.post<ApiResponse<GalleryPhoto>>(`${this.apiBase}/galleries/${id}/photos`, req);
  }

  updatePhoto(id: number, photoID: number, req: UpdatePhotoReq): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.apiBase}/galleries/${id}/photos/${photoID}`, req);
  }

  deletePhoto(id: number, photoID: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiBase}/galleries/${id}/photos/${photoID}`);
  }

  reorderPhotos(id: number, req: ReorderPhotosReq): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiBase}/galleries/${id}/photos/reorder`, req);
  }
}
