import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Campaign, CampaignCategory, CampaignDetail, CampaignLite, CreateCampaignRequest, UpdateCampaignRequest } from '../entities/campaign';

/** Panggilan HTTP mentah modul campaign — endpoint publik + CMS. Campaign
 * murni CRUD berbasis permission sejak revisi 2026-09-01 (tidak ada lagi
 * endpoint milik-sendiri). */
@Injectable({ providedIn: 'root' })
export class CampaignApiService {
  private api = inject(ApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Campaign>> { return this.api.get('/public/campaigns', q); }
  publicDetail(slug: string): Observable<CampaignDetail> { return this.api.get(`/public/campaigns/${slug}`); }
  categories(): Observable<CampaignCategory[]> { return this.api.get('/public/campaign-categories'); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Campaign>> { return this.api.get('/campaigns', q); }
  cmsLite(): Observable<CampaignLite[]> { return this.api.get('/campaigns/lite'); }
  cmsGet(id: number): Observable<CampaignDetail> { return this.api.get(`/campaigns/${id}`); }
  create(body: CreateCampaignRequest): Observable<CampaignDetail> { return this.api.post('/campaigns', body); }
  update(id: number, body: UpdateCampaignRequest): Observable<CampaignDetail> { return this.api.put(`/campaigns/${id}`, body); }
  delete(id: number): Observable<void> { return this.api.delete(`/campaigns/${id}`); }
  publish(id: number): Observable<CampaignDetail> { return this.api.post(`/campaigns/${id}/publish`); }
  pause(id: number): Observable<CampaignDetail> { return this.api.post(`/campaigns/${id}/pause`); }
  resume(id: number): Observable<CampaignDetail> { return this.api.post(`/campaigns/${id}/resume`); }
  archive(id: number): Observable<CampaignDetail> { return this.api.post(`/campaigns/${id}/archive`); }
}
