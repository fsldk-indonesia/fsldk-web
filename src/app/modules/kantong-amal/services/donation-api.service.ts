import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CreateDonationRequest, Donation, DonationStatusResponse, PublicDonationItem } from '../entities/donation';

/** Panggilan HTTP mentah modul donation — endpoint publik saja di fase ini. */
@Injectable({ providedIn: 'root' })
export class DonationApiService {
  private api = inject(ApiService);

  create(slug: string, body: CreateDonationRequest): Observable<Donation> { return this.api.post(`/public/campaigns/${slug}/donate`, body); }
  recentDonations(slug: string, limit = 10): Observable<PublicDonationItem[]> { return this.api.get(`/public/campaigns/${slug}/donations`, { limit }); }
  detail(publicRef: string): Observable<Donation> { return this.api.get(`/public/donations/${publicRef}`); }
  status(publicRef: string): Observable<DonationStatusResponse> { return this.api.get(`/public/donations/${publicRef}/status`, undefined, { silent: true }); }
}
