import { Injectable, inject } from '@angular/core';
import { BasePresenter } from '../../../../core/mvp/base.presenter';
import { CampaignRepository } from '../../repositories/campaign.repository';
import { WalletRepository } from '../../repositories/wallet.repository';
import { WithdrawalRepository } from '../../repositories/withdrawal.repository';
import { SecurityVerifyRequest } from '../../entities/withdrawal';
import { KantongAmalWithdrawalFormView } from './kantong-amal.withdrawal-form.view';

@Injectable()
export class KantongAmalWithdrawalFormPresenter extends BasePresenter<KantongAmalWithdrawalFormView> {
  private campaignRepo = inject(CampaignRepository);
  private walletRepo = inject(WalletRepository);
  private withdrawalRepo = inject(WithdrawalRepository);

  load(campaignID: number): void {
    this.view.setLoading(true);
    this.campaignRepo.myGet(campaignID).subscribe({
      next: (campaign) => {
        this.view.setCampaign(campaign);
        this.withdrawalRepo.inquiry({ bankCode: campaign.beneficiaryBankCode, accountNumber: campaign.beneficiaryAccountNumber }).subscribe({
          next: (inquiry) => this.view.setInquiry(inquiry),
          error: () => this.view.setInquiry(null),
        });
      },
      error: () => this.view.setCampaign(null),
    });
    this.walletRepo.myBalance(campaignID).subscribe({
      next: (balance) => { this.view.setBalance(balance); this.view.setLoading(false); },
      error: () => { this.view.setBalance(null); this.view.setLoading(false); },
    });
  }

  request(campaignID: number, amount: number): void {
    this.view.setBusy(true);
    this.withdrawalRepo.request(campaignID, { amount, idempotencyKey: crypto.randomUUID() }).subscribe({
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
