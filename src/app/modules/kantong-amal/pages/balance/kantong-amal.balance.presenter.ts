import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { WalletRepository } from '../../repositories/wallet.repository';
import { KantongAmalBalanceView } from './kantong-amal.balance.view';

@Injectable()
export class KantongAmalBalancePresenter extends BasePresenter<KantongAmalBalanceView> {
  private campaignRepo = inject(CampaignRepository);
  private walletRepo = inject(WalletRepository);

  load(campaignID: number): void {
    this.view.setLoading(true);
    this.campaignRepo.myGet(campaignID).subscribe({
      next: (campaign) => this.view.setCampaign(campaign),
      error: () => this.view.setCampaign(null),
    });
    this.walletRepo.myBalance(campaignID).subscribe({
      next: (balance) => { this.view.setBalance(balance); this.view.setLoading(false); },
      error: () => { this.view.setBalance(null); this.view.setLoading(false); },
    });
  }
}
