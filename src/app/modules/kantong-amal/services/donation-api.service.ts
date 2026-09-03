import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { AdminCreateDonationRequest, AdminUpdateDonationRequest, CreateDonationRequest, Donation, DonationAdminDetail, DonationStatusResponse, PublicDonationItem } from '../entities/donation';

/** Panggilan HTTP mentah modul donation — endpoint publik + CMS. */
@Injectable({ providedIn: 'root' })
export class DonationApiService {
  private api = inject(ApiService);

  create(slug: string, body: CreateDonationRequest): Observable<Donation> { return this.api.post(`/public/campaigns/${slug}/donate`, body); }
  recentDonations(slug: string, limit = 10): Observable<PublicDonationItem[]> { return this.api.get(`/public/campaigns/${slug}/donations`, { limit }); }
  detail(publicRef: string): Observable<Donation> { return this.api.get(`/public/donations/${publicRef}`); }
  downloadReceipt(publicRef: string): Observable<{ blob: Blob; filename: string }> { return this.api.getBlob(`/public/donations/${publicRef}/receipt.pdf`); }
  status(publicRef: string): Observable<DonationStatusResponse> { return this.api.get(`/public/donations/${publicRef}/status`, undefined, { silent: true }); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Donation>> { return this.api.get('/donations', q); }
  cmsGet(id: number): Observable<DonationAdminDetail> { return this.api.get(`/donations/${id}`); }
  adminCreate(body: AdminCreateDonationRequest): Observable<Donation> { return this.api.post('/donations', body); }
  adminUpdate(id: number, body: AdminUpdateDonationRequest): Observable<Donation> { return this.api.put(`/donations/${id}`, body); }
  adminDelete(id: number): Observable<void> { return this.api.delete(`/donations/${id}`); }
}
