import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { ShortLinkRequest } from '../entities/shortlink-request';
import { ShortLinkPIC } from '../entities/shortlink-pic';

export interface SubmitShortLinkRequestBody {
  requesterName: string;
  requesterEmail: string;
  requesterWhatsapp: string;
  destinationURL: string;
  requestedKey?: string;
  note?: string;
}

/** Panggilan HTTP mentah untuk permintaan shortlink (/shortlink-requests, /public/shortlink-requests). */
@Injectable({ providedIn: 'root' })
export class ShortlinkRequestApiService {
  private api = inject(ApiService);

  submit(body: SubmitShortLinkRequestBody): Observable<ShortLinkRequest> { return this.api.post('/public/shortlink-requests', body); }
  pic(): Observable<ShortLinkPIC> { return this.api.get('/public/shortlink-requests/pic', undefined, { silent: true }); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<ShortLinkRequest>> { return this.api.get('/shortlink-requests', q); }
  cmsGet(id: number): Observable<ShortLinkRequest> { return this.api.get(`/shortlink-requests/${id}`); }
  approve(id: number): Observable<ShortLinkRequest> { return this.api.post(`/shortlink-requests/${id}/approve`); }
  reject(id: number, rejectionReason: string): Observable<unknown> { return this.api.post(`/shortlink-requests/${id}/reject`, { rejectionReason }); }
}
