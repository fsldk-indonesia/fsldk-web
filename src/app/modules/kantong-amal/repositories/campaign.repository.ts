import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CampaignApiService } from '../services/campaign-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Campaign, CampaignCategory, CampaignDetail } from '../entities/campaign';

@Injectable({ providedIn: 'root' })
export class CampaignRepository {
  private api = inject(CampaignApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Campaign>> { return this.api.publicList(q); }
  publicDetail(slug: string): Observable<CampaignDetail> { return this.api.publicDetail(slug); }
  categories(): Observable<CampaignCategory[]> { return this.api.categories(); }
}
