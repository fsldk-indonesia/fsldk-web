import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { KantongAmalMyCampaignsView } from './kantong-amal.my-campaigns.view';

@Injectable()
export class KantongAmalMyCampaignsPresenter extends BasePresenter<KantongAmalMyCampaignsView> {
  private campaignRepo = inject(CampaignRepository);

  load(page: number, limit: number): void {
    this.view.setLoading(true);
    this.campaignRepo.myList({ page, limit }).subscribe({
      next: (p) => { this.view.setCampaigns(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
