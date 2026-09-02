import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { DonationRepository } from '../../repositories/donation.repository';
import { AdminCreateDonationRequest, AdminUpdateDonationRequest } from '../../entities/donation';
import { KantongAmalAdminDonationFormView } from './kantong-amal.admin-donation-form.view';

@Injectable()
export class KantongAmalAdminDonationFormPresenter extends BasePresenter<KantongAmalAdminDonationFormView> {
  private campaignRepo = inject(CampaignRepository);
  private donationRepo = inject(DonationRepository);

  loadCampaigns(): void {
    this.campaignRepo.cmsLite().subscribe({ next: (c) => this.view.setCampaigns(c), error: () => this.view.setCampaigns([]) });
  }

  load(id: number): void {
    this.view.setLoading(true);
    this.donationRepo.cmsGet(id).subscribe({
      next: (donation) => { this.view.setDonation(donation); this.view.setLoading(false); },
      error: () => { this.view.setDonation(null); this.view.setLoading(false); },
    });
  }

  create(body: AdminCreateDonationRequest): void {
    this.view.setSaving(true);
    this.donationRepo.adminCreate(body).subscribe({
      next: (donation) => { this.view.setSaving(false); this.view.onSaveSuccess(donation); },
      error: () => this.view.setSaving(false),
    });
  }

  update(id: number, body: AdminUpdateDonationRequest): void {
    this.view.setSaving(true);
    this.donationRepo.adminUpdate(id, body).subscribe({
      next: (donation) => { this.view.setSaving(false); this.view.onSaveSuccess(donation); },
      error: () => this.view.setSaving(false),
    });
  }
}
