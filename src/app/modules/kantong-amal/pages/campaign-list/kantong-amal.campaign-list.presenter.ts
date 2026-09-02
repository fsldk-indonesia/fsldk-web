import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { KantongAmalCampaignListView } from './kantong-amal.campaign-list.view';

@Injectable()
export class KantongAmalCampaignListPresenter extends BasePresenter<KantongAmalCampaignListView> {
  private campaignRepo = inject(CampaignRepository);

  loadCategories(): void {
    this.campaignRepo.categories().subscribe({ next: (c) => this.view.setCategories(c), error: () => {} });
  }

  load(page: number, limit: number, search: string, categoryID: number, sort: string): void {
    this.view.setLoading(true);
    this.campaignRepo.publicList({ page, limit, search, categoryID: categoryID || undefined, sort }).subscribe({
      next: (p) => { this.view.setCampaigns(p.data, p.count); this.view.setLoading(false); },
      error: () => this.view.setLoading(false),
    });
  }
}
