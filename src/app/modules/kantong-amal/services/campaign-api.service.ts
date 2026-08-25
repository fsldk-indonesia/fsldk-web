import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Campaign, CampaignCategory, CampaignDetail } from '../entities/campaign';

/** Panggilan HTTP mentah modul campaign — endpoint publik saja di fase ini. */
@Injectable({ providedIn: 'root' })
export class CampaignApiService {
  private api = inject(ApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Campaign>> { return this.api.get('/public/campaigns', q); }
  publicDetail(slug: string): Observable<CampaignDetail> { return this.api.get(`/public/campaigns/${slug}`); }
  categories(): Observable<CampaignCategory[]> { return this.api.get('/public/campaign-categories'); }
}
