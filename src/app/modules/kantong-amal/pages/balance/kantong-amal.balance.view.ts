import { CampaignDetail } from '../../entities/campaign';
import { WalletBalance } from '../../entities/wallet';

export interface KantongAmalBalanceView {
  setLoading(loading: boolean): void;
  setCampaign(campaign: CampaignDetail | null): void;
  setBalance(balance: WalletBalance | null): void;
}
