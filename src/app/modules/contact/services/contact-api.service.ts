import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/entities/api-response';
import {
  ContactDetail,
  ContactListItem,
  ContactListQuery,
  ContactListResponse,
  SendContactPayload,
} from '../entities/contact';

/**
 * HTTP client service for interacting with contact message backend endpoints.
 */
@Injectable({ providedIn: 'root' })
export class ContactApiService {
  private http = inject(HttpClient);
  private apiBase = environment.apiBaseUrl;

  /**
   * Submit a contact inquiry from the public contact form.
   */
  sendPublicMessage(payload: SendContactPayload): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiBase}/public/contact`, payload);
  }

  /**
   * List contact messages with search, filtering, and pagination in CMS.
   */
  listCMS(query: ContactListQuery = {}): Observable<ApiResponse<ContactListResponse>> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.isRead !== undefined && query.isRead !== '') params = params.set('isRead', String(query.isRead));
    if (query.sort_by) params = params.set('sort_by', query.sort_by);
    if (query.sort_order) params = params.set('sort_order', query.sort_order);

    return this.http.get<ApiResponse<ContactListResponse>>(`${this.apiBase}/contact-messages`, { params });
  }

  /**
   * Retrieve full details of a contact message by ID (marks as read automatically).
   */
  getCMS(id: number): Observable<ApiResponse<ContactDetail>> {
    return this.http.get<ApiResponse<ContactDetail>>(`${this.apiBase}/contact-messages/${id}`);
  }

  /**
   * Explicitly mark a contact message as read.
   */
  markReadCMS(id: number): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiBase}/contact-messages/${id}/read`, {});
  }

  /**
   * Delete a contact message by ID.
   */
  deleteCMS(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiBase}/contact-messages/${id}`);
  }
}
