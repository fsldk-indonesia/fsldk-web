import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { DonationRepository } from '../../repositories/donation.repository';
import { CreateDonationRequest } from '../../entities/donation';
import { KantongAmalDonateView } from './kantong-amal.donate.view';

@Injectable()
export class KantongAmalDonatePresenter extends BasePresenter<KantongAmalDonateView> {
  private campaignRepo = inject(CampaignRepository);
  private donationRepo = inject(DonationRepository);

  loadCampaign(slug: string): void {
    this.view.setLoading(true);
    this.campaignRepo.publicDetail(slug).subscribe({
      next: (campaign) => { this.view.setCampaign(campaign); this.view.setLoading(false); },
      error: () => { this.view.setCampaign(null); this.view.setLoading(false); },
    });
  }

  submit(slug: string, body: CreateDonationRequest): void {
    this.view.setSubmitting(true);
    this.donationRepo.create(slug, body).subscribe({
      next: (donation) => { this.view.setSubmitting(false); this.view.onSubmitSuccess(donation.publicRef); },
      error: () => this.view.setSubmitting(false),
    });
  }
}
