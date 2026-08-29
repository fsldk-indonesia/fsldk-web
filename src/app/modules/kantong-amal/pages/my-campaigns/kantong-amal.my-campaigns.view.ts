import { Campaign } from '../../entities/campaign';

export interface KantongAmalMyCampaignsView {
  setLoading(loading: boolean): void;
  setCampaigns(campaigns: Campaign[], count: number): void;
}
