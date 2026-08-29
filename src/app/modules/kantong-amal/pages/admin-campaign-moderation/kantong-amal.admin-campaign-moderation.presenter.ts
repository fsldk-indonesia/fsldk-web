import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { ReviewRequest } from '../../entities/campaign';
import { KantongAmalAdminCampaignModerationView } from './kantong-amal.admin-campaign-moderation.view';

@Injectable()
export class KantongAmalAdminCampaignModerationPresenter extends BasePresenter<KantongAmalAdminCampaignModerationView> {
  private campaignRepo = inject(CampaignRepository);

  load(page: number, limit: number, status: string): void {
    this.view.setLoading(true);
    this.campaignRepo.cmsList({ page, limit, status: status || undefined }).subscribe({
      next: (p) => { this.view.setCampaigns(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }

  loadDetail(id: number): void {
    this.campaignRepo.cmsGet(id).subscribe({ next: (d) => this.view.setDetail(d), error: () => this.view.setDetail(null) });
  }

  review(id: number, body: ReviewRequest): void {
    this.view.setSubmitting(true);
    this.campaignRepo.review(id, body).subscribe({
      next: () => { this.view.setSubmitting(false); this.view.onReviewSuccess(); },
      error: () => this.view.setSubmitting(false),
    });
  }
}
