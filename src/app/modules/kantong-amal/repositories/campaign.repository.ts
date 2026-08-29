import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CampaignApiService } from '../services/campaign-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Campaign, CampaignCategory, CampaignDetail, CreateCampaignRequest, UpdateBeneficiaryRequest, UpdateCampaignRequest } from '../entities/campaign';

@Injectable({ providedIn: 'root' })
export class CampaignRepository {
  private api = inject(CampaignApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Campaign>> { return this.api.publicList(q); }
  publicDetail(slug: string): Observable<CampaignDetail> { return this.api.publicDetail(slug); }
  categories(): Observable<CampaignCategory[]> { return this.api.categories(); }

  myList(q: Record<string, unknown>): Observable<Pagination<Campaign>> { return this.api.myList(q); }
  myGet(id: number): Observable<CampaignDetail> { return this.api.myGet(id); }
  create(body: CreateCampaignRequest): Observable<CampaignDetail> { return this.api.create(body); }
  update(id: number, body: UpdateCampaignRequest): Observable<CampaignDetail> { return this.api.update(id, body); }
  updateBeneficiary(id: number, body: UpdateBeneficiaryRequest): Observable<CampaignDetail> { return this.api.updateBeneficiary(id, body); }
  submit(id: number): Observable<CampaignDetail> { return this.api.submit(id); }
}
