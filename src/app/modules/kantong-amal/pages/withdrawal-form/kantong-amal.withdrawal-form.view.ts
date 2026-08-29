import { CampaignDetail } from '../../entities/campaign';
import { WalletBalance } from '../../entities/wallet';
import { InquiryResponse, Withdrawal } from '../../entities/withdrawal';

export interface KantongAmalWithdrawalFormView {
  setLoading(loading: boolean): void;
  setBusy(busy: boolean): void;
  setCampaign(campaign: CampaignDetail | null): void;
  setBalance(balance: WalletBalance | null): void;
  setInquiry(inquiry: InquiryResponse | null): void;
  onRequestSuccess(withdrawal: Withdrawal): void;
  onOtpSent(): void;
  onVerifySuccess(): void;
}
