import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CampaignApiService } from '../services/campaign-api.service';
import { Pagination } from '../../../core/entities/pagination';
import { Campaign, CampaignCategory, CampaignDetail, CampaignLite, CreateCampaignRequest, UpdateCampaignRequest } from '../entities/campaign';

@Injectable({ providedIn: 'root' })
export class CampaignRepository {
  private api = inject(CampaignApiService);

  publicList(q: Record<string, unknown>): Observable<Pagination<Campaign>> { return this.api.publicList(q); }
  publicDetail(slug: string): Observable<CampaignDetail> { return this.api.publicDetail(slug); }
  categories(): Observable<CampaignCategory[]> { return this.api.categories(); }

  cmsList(q: Record<string, unknown>): Observable<Pagination<Campaign>> { return this.api.cmsList(q); }
  cmsLite(): Observable<CampaignLite[]> { return this.api.cmsLite(); }
  cmsGet(id: number): Observable<CampaignDetail> { return this.api.cmsGet(id); }
  create(body: CreateCampaignRequest): Observable<CampaignDetail> { return this.api.create(body); }
  update(id: number, body: UpdateCampaignRequest): Observable<CampaignDetail> { return this.api.update(id, body); }
  delete(id: number): Observable<void> { return this.api.delete(id); }
  publish(id: number): Observable<CampaignDetail> { return this.api.publish(id); }
  pause(id: number): Observable<CampaignDetail> { return this.api.pause(id); }
  resume(id: number): Observable<CampaignDetail> { return this.api.resume(id); }
  archive(id: number): Observable<CampaignDetail> { return this.api.archive(id); }
}
