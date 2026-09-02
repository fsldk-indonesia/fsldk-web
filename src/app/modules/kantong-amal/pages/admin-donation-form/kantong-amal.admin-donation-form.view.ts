import { CampaignLite } from '../../entities/campaign';
import { Donation, DonationAdminDetail } from '../../entities/donation';

export interface KantongAmalAdminDonationFormView {
  setLoading(loading: boolean): void;
  setSaving(saving: boolean): void;
  setCampaigns(campaigns: CampaignLite[]): void;
  setDonation(donation: DonationAdminDetail | null): void;
  onSaveSuccess(donation: Donation): void;
}
