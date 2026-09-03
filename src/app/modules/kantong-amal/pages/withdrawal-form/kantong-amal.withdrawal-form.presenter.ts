import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { WalletRepository } from '../../repositories/wallet.repository';
import { WithdrawalRepository } from '../../repositories/withdrawal.repository';
import { CreateWithdrawalRequest, InquiryRequest, SecurityVerifyRequest } from '../../entities/withdrawal';
import { KantongAmalWithdrawalFormView } from './kantong-amal.withdrawal-form.view';

@Injectable()
export class KantongAmalWithdrawalFormPresenter extends BasePresenter<KantongAmalWithdrawalFormView> {
  private campaignRepo = inject(CampaignRepository);
  private walletRepo = inject(WalletRepository);
  private withdrawalRepo = inject(WithdrawalRepository);

  load(): void {
    this.view.setLoading(true);
    this.campaignRepo.cmsLite().subscribe({
      next: (campaigns) => { this.view.setCampaigns(campaigns); this.view.setLoading(false); },
      error: () => { this.view.setCampaigns([]); this.view.setLoading(false); },
    });
    this.withdrawalRepo.listBanks().subscribe({ next: (banks) => this.view.setBanks(banks), error: () => this.view.setBanks([]) });
  }

  loadBalance(campaignID: number): void {
    this.walletRepo.cmsBalance(campaignID).subscribe({
      next: (balance) => this.view.setBalance(balance),
      error: () => this.view.setBalance(null),
    });
  }

  inquiry(body: InquiryRequest): void {
    this.view.setBusy(true);
    this.withdrawalRepo.inquiry(body).subscribe({
      next: (res) => { this.view.setBusy(false); this.view.setInquiry(res); },
      error: () => { this.view.setBusy(false); this.view.setInquiry(null); },
    });
  }

  request(campaignID: number, body: CreateWithdrawalRequest): void {
    this.view.setBusy(true);
    this.withdrawalRepo.request(campaignID, body).subscribe({
      next: (withdrawal) => { this.view.setBusy(false); this.view.onRequestSuccess(withdrawal); },
      error: () => this.view.setBusy(false),
    });
  }

  requestOtp(withdrawalID: number): void {
    this.view.setBusy(true);
    this.withdrawalRepo.requestSecurityOtp(withdrawalID).subscribe({
      next: () => { this.view.setBusy(false); this.view.onOtpSent(); },
      error: () => this.view.setBusy(false),
    });
  }

  verify(withdrawalID: number, body: SecurityVerifyRequest): void {
    this.view.setBusy(true);
    this.withdrawalRepo.verifySecurity(withdrawalID, body).subscribe({
      next: () => { this.view.setBusy(false); this.view.onVerifySuccess(); },
      error: () => this.view.setBusy(false),
    });
  }
}
