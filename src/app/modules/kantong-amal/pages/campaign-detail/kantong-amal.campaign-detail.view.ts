import { CampaignDetail } from '../../entities/campaign';
import { PublicDonationItem } from '../../entities/donation';

export interface KantongAmalCampaignDetailView {
  setLoading(loading: boolean): void;
  setCampaign(campaign: CampaignDetail | null): void;
  setRecentDonations(donations: PublicDonationItem[]): void;
}
