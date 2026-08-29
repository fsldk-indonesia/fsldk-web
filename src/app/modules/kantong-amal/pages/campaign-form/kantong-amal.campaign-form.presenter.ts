import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { WithdrawalRepository } from '../../repositories/withdrawal.repository';
import { CreateCampaignRequest, UpdateCampaignRequest } from '../../entities/campaign';
import { KantongAmalCampaignFormView } from './kantong-amal.campaign-form.view';

@Injectable()
export class KantongAmalCampaignFormPresenter extends BasePresenter<KantongAmalCampaignFormView> {
  private campaignRepo = inject(CampaignRepository);
  private withdrawalRepo = inject(WithdrawalRepository);

  loadBanks(): void {
    this.withdrawalRepo.listBanks().subscribe({ next: (banks) => this.view.setBanks(banks), error: () => this.view.setBanks([]) });
  }

  load(id: number): void {
    this.view.setLoading(true);
    this.campaignRepo.myGet(id).subscribe({
      next: (campaign) => { this.view.setCampaign(campaign); this.view.setLoading(false); },
      error: () => { this.view.setCampaign(null); this.view.setLoading(false); },
    });
  }

  create(body: CreateCampaignRequest): void {
    this.view.setSaving(true);
    this.campaignRepo.create(body).subscribe({
      next: (campaign) => { this.view.setSaving(false); this.view.onSaveSuccess(campaign); },
      error: () => this.view.setSaving(false),
    });
  }

  update(id: number, body: UpdateCampaignRequest): void {
    this.view.setSaving(true);
    this.campaignRepo.update(id, body).subscribe({
      next: (campaign) => { this.view.setSaving(false); this.view.onSaveSuccess(campaign); },
      error: () => this.view.setSaving(false),
    });
  }

  submit(id: number): void {
    this.view.setSaving(true);
    this.campaignRepo.submit(id).subscribe({
      next: () => { this.view.setSaving(false); this.view.onSubmitSuccess(); },
      error: () => this.view.setSaving(false),
    });
  }
}
