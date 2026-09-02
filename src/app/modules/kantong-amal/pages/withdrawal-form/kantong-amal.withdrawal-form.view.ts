import { CampaignLite } from '../../entities/campaign';
import { WalletBalance } from '../../entities/wallet';
import { BankListItem, InquiryResponse, Withdrawal } from '../../entities/withdrawal';

export interface KantongAmalWithdrawalFormView {
  setLoading(loading: boolean): void;
  setBusy(busy: boolean): void;
  setCampaigns(campaigns: CampaignLite[]): void;
  setBanks(banks: BankListItem[]): void;
  setBalance(balance: WalletBalance | null): void;
  setInquiry(inquiry: InquiryResponse | null): void;
  onRequestSuccess(withdrawal: Withdrawal): void;
  onOtpSent(): void;
  onVerifySuccess(): void;
}
