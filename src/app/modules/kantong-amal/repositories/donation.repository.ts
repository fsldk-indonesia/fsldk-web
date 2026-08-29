import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DonationApiService } from '../services/donation-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { CreateDonationRequest, Donation, DonationStatusResponse, PublicDonationItem } from '../entities/donation';

@Injectable({ providedIn: 'root' })
export class DonationRepository {
  private api = inject(DonationApiService);

  create(slug: string, body: CreateDonationRequest): Observable<Donation> { return this.api.create(slug, body); }
  recentDonations(slug: string, limit?: number): Observable<PublicDonationItem[]> { return this.api.recentDonations(slug, limit); }
  detail(publicRef: string): Observable<Donation> { return this.api.detail(publicRef); }
  status(publicRef: string): Observable<DonationStatusResponse> { return this.api.status(publicRef); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Donation>> { return this.api.cmsList(q); }
}
