import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Campaign, CampaignCategory, CampaignDetail, CampaignReview, CreateCampaignRequest, ReviewRequest, UpdateBeneficiaryRequest, UpdateCampaignRequest } from '../entities/campaign';

/** Panggilan HTTP mentah modul campaign — endpoint publik + milik-sendiri. */
@Injectable({ providedIn: 'root' })
export class CampaignApiService {
  private api = inject(ApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Campaign>> { return this.api.get('/public/campaigns', q); }
  publicDetail(slug: string): Observable<CampaignDetail> { return this.api.get(`/public/campaigns/${slug}`); }
  categories(): Observable<CampaignCategory[]> { return this.api.get('/public/campaign-categories'); }

  myList(q: Record<string, unknown>): Observable<Pagination<Campaign>> { return this.api.get('/me/campaigns', q); }
  myGet(id: number): Observable<CampaignDetail> { return this.api.get(`/me/campaigns/${id}`); }
  create(body: CreateCampaignRequest): Observable<CampaignDetail> { return this.api.post('/me/campaigns', body); }
  update(id: number, body: UpdateCampaignRequest): Observable<CampaignDetail> { return this.api.put(`/me/campaigns/${id}`, body); }
  updateBeneficiary(id: number, body: UpdateBeneficiaryRequest): Observable<CampaignDetail> { return this.api.put(`/me/campaigns/${id}/beneficiary`, body); }
  submit(id: number): Observable<CampaignDetail> { return this.api.post(`/me/campaigns/${id}/submit`); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Campaign>> { return this.api.get('/campaigns', q); }
  cmsGet(id: number): Observable<CampaignDetail> { return this.api.get(`/campaigns/${id}`); }
  reviewHistory(id: number): Observable<CampaignReview[]> { return this.api.get(`/campaigns/${id}/review-history`); }
  review(id: number, body: ReviewRequest): Observable<CampaignDetail> { return this.api.post(`/campaigns/${id}/review`, body); }
  publish(id: number): Observable<CampaignDetail> { return this.api.post(`/campaigns/${id}/publish`); }
  pause(id: number): Observable<CampaignDetail> { return this.api.post(`/campaigns/${id}/pause`); }
  resume(id: number): Observable<CampaignDetail> { return this.api.post(`/campaigns/${id}/resume`); }
  archive(id: number): Observable<CampaignDetail> { return this.api.post(`/campaigns/${id}/archive`); }
}
